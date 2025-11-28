#!/usr/bin/env python3
"""
Music Generation Script using Meta's MusicGen
==============================================

This script generates music for the game using MusicGen.
Run this during development to create audio assets.

Requirements:
    pip install torch torchaudio transformers scipy

For GPU acceleration (recommended):
    pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu118

Usage:
    python generate-music.py

The generated files will be saved to ../assets/audio/music/
"""

import os
import sys
from pathlib import Path

# Check dependencies
try:
    import torch
    from transformers import AutoProcessor, MusicgenForConditionalGeneration
    import scipy.io.wavfile as wavfile
except ImportError:
    print("Missing dependencies. Install with:")
    print("  pip install torch torchaudio transformers scipy")
    sys.exit(1)

# Output directory
OUTPUT_DIR = Path(__file__).parent.parent / "assets" / "audio" / "music"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Music prompts for different game states
MUSIC_PROMPTS = {
    "menu": {
        "prompt": "atmospheric dark fantasy ambient music, mysterious, magical, orchestral strings, slow tempo, haunting melody",
        "duration": 30,  # seconds
    },
    "dungeon_floor1": {
        "prompt": "tense dungeon exploration music, dark ambient, subtle percussion, eerie atmosphere, fantasy RPG",
        "duration": 60,
    },
    "dungeon_floor2": {
        "prompt": "intense dungeon music, darker tone, ominous, orchestral, building tension, fantasy adventure",
        "duration": 60,
    },
    "boss": {
        "prompt": "epic boss battle music, intense orchestral, fast tempo, dramatic, fantasy combat, powerful brass",
        "duration": 45,
    },
    "victory": {
        "prompt": "triumphant victory fanfare, uplifting orchestral, heroic, celebratory, fantasy RPG victory theme",
        "duration": 15,
    },
    "game_over": {
        "prompt": "somber game over music, melancholic, slow, orchestral strings, reflective, fantasy",
        "duration": 15,
    },
}


def generate_music(model, processor, prompt: str, duration: int, output_path: Path):
    """Generate music from a text prompt."""
    print(f"Generating: {output_path.name}")
    print(f"  Prompt: {prompt[:50]}...")
    print(f"  Duration: {duration}s")
    
    # Prepare inputs
    inputs = processor(
        text=[prompt],
        padding=True,
        return_tensors="pt",
    )
    
    # Move to GPU if available
    device = "cuda" if torch.cuda.is_available() else "cpu"
    inputs = {k: v.to(device) for k, v in inputs.items()}
    model = model.to(device)
    
    # Generate (256 tokens ≈ 5 seconds for musicgen-small)
    # Adjust max_new_tokens based on desired duration
    tokens_per_second = 50  # approximate for musicgen-small
    max_tokens = duration * tokens_per_second
    
    with torch.no_grad():
        audio_values = model.generate(
            **inputs,
            max_new_tokens=min(max_tokens, 1500),  # Cap at ~30s for memory
            do_sample=True,
            guidance_scale=3.0,
        )
    
    # Get sample rate from model config
    sample_rate = model.config.audio_encoder.sampling_rate
    
    # Convert to numpy and save
    audio_data = audio_values[0, 0].cpu().numpy()
    wavfile.write(str(output_path), sample_rate, audio_data)
    
    print(f"  Saved: {output_path}")
    return output_path


def main():
    print("=" * 60)
    print("MusicGen Audio Generator for Arcane Depths")
    print("=" * 60)
    
    # Check for GPU
    if torch.cuda.is_available():
        print(f"Using GPU: {torch.cuda.get_device_name(0)}")
    else:
        print("WARNING: No GPU detected. Generation will be slow.")
    
    print("\nLoading MusicGen model (this may take a while)...")
    
    # Load model - use "small" for faster generation, "medium" for better quality
    # Options: "facebook/musicgen-small", "facebook/musicgen-medium", "facebook/musicgen-large"
    model_name = "facebook/musicgen-small"
    
    try:
        processor = AutoProcessor.from_pretrained(model_name)
        model = MusicgenForConditionalGeneration.from_pretrained(model_name)
        print(f"Loaded model: {model_name}")
    except Exception as e:
        print(f"Error loading model: {e}")
        print("\nTry running: huggingface-cli login")
        sys.exit(1)
    
    # Generate each track
    print(f"\nGenerating {len(MUSIC_PROMPTS)} tracks...")
    print(f"Output directory: {OUTPUT_DIR}")
    print("-" * 60)
    
    for name, config in MUSIC_PROMPTS.items():
        output_path = OUTPUT_DIR / f"{name}.wav"
        
        try:
            generate_music(
                model=model,
                processor=processor,
                prompt=config["prompt"],
                duration=config["duration"],
                output_path=output_path,
            )
        except Exception as e:
            print(f"  ERROR generating {name}: {e}")
            continue
    
    print("-" * 60)
    print("Done! Convert to MP3/OGG for smaller file sizes:")
    print("  ffmpeg -i menu.wav -b:a 128k menu.mp3")
    print("  ffmpeg -i menu.wav -c:a libvorbis -q:a 4 menu.ogg")


if __name__ == "__main__":
    main()
