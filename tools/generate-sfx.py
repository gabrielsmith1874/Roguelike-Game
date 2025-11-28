#!/usr/bin/env python3
"""
Sound Effects Generation Script using Meta's AudioGen
======================================================

This script generates sound effects for the game using AudioGen.
Run this during development to create SFX assets.

Requirements:
    pip install torch torchaudio transformers scipy

Usage:
    python generate-sfx.py

The generated files will be saved to ../assets/audio/sfx/
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
OUTPUT_DIR = Path(__file__).parent.parent / "assets" / "audio" / "sfx"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Sound effect prompts
SFX_PROMPTS = {
    # Spells
    "spell_fire": {
        "prompt": "fire spell cast, whoosh, magical flame sound effect",
        "duration": 1,
    },
    "spell_ice": {
        "prompt": "ice spell cast, crystalline, freezing magical sound effect",
        "duration": 1,
    },
    "spell_lightning": {
        "prompt": "lightning bolt spell, electric zap, thunder crack sound effect",
        "duration": 1,
    },
    "spell_arcane": {
        "prompt": "magical arcane spell, mystical energy, fantasy sound effect",
        "duration": 1,
    },
    
    # Combat
    "hit_enemy": {
        "prompt": "sword slash hit, combat impact, fantasy game sound effect",
        "duration": 0.5,
    },
    "hit_player": {
        "prompt": "player hurt sound, pain grunt, damage taken sound effect",
        "duration": 0.5,
    },
    "enemy_death": {
        "prompt": "monster death sound, creature dying, fantasy game sound effect",
        "duration": 1,
    },
    "explosion": {
        "prompt": "magical explosion, burst of energy, fantasy game sound effect",
        "duration": 1,
    },
    
    # Items
    "pickup_item": {
        "prompt": "item pickup sound, collect coin, positive chime sound effect",
        "duration": 0.5,
    },
    "pickup_health": {
        "prompt": "health potion drink, healing magic, restoration sound effect",
        "duration": 0.5,
    },
    "pickup_mana": {
        "prompt": "mana restore, magical energy refill, mystical sound effect",
        "duration": 0.5,
    },
    "chest_open": {
        "prompt": "treasure chest opening, wooden creak, loot reveal sound effect",
        "duration": 1,
    },
    
    # Environment
    "door_open": {
        "prompt": "heavy stone door opening, dungeon door, grinding stone sound effect",
        "duration": 1,
    },
    "footstep": {
        "prompt": "footstep on stone floor, walking sound, dungeon footstep",
        "duration": 0.3,
    },
    
    # UI
    "ui_click": {
        "prompt": "button click, UI selection, soft click sound effect",
        "duration": 0.2,
    },
    "ui_hover": {
        "prompt": "soft whoosh, UI hover, subtle transition sound effect",
        "duration": 0.2,
    },
    "level_up": {
        "prompt": "level up fanfare, achievement unlocked, triumphant chime",
        "duration": 1.5,
    },
}


def generate_sfx(model, processor, prompt: str, duration: float, output_path: Path):
    """Generate a sound effect from a text prompt."""
    print(f"Generating: {output_path.name}")
    
    inputs = processor(
        text=[prompt],
        padding=True,
        return_tensors="pt",
    )
    
    device = "cuda" if torch.cuda.is_available() else "cpu"
    inputs = {k: v.to(device) for k, v in inputs.items()}
    model = model.to(device)
    
    # Short duration for SFX
    tokens_per_second = 50
    max_tokens = max(int(duration * tokens_per_second), 25)
    
    with torch.no_grad():
        audio_values = model.generate(
            **inputs,
            max_new_tokens=max_tokens,
            do_sample=True,
            guidance_scale=3.0,
        )
    
    sample_rate = model.config.audio_encoder.sampling_rate
    audio_data = audio_values[0, 0].cpu().numpy()
    
    # Trim to exact duration
    samples_needed = int(duration * sample_rate)
    if len(audio_data) > samples_needed:
        audio_data = audio_data[:samples_needed]
    
    wavfile.write(str(output_path), sample_rate, audio_data)
    print(f"  Saved: {output_path}")


def main():
    print("=" * 60)
    print("AudioGen SFX Generator for Arcane Depths")
    print("=" * 60)
    
    if torch.cuda.is_available():
        print(f"Using GPU: {torch.cuda.get_device_name(0)}")
    else:
        print("WARNING: No GPU detected. Generation will be slow.")
    
    print("\nLoading model...")
    
    # AudioGen is better for SFX, but MusicGen works too
    # Try "facebook/audiogen-medium" if available
    model_name = "facebook/musicgen-small"
    
    try:
        processor = AutoProcessor.from_pretrained(model_name)
        model = MusicgenForConditionalGeneration.from_pretrained(model_name)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
    
    print(f"\nGenerating {len(SFX_PROMPTS)} sound effects...")
    print(f"Output: {OUTPUT_DIR}")
    print("-" * 60)
    
    for name, config in SFX_PROMPTS.items():
        output_path = OUTPUT_DIR / f"{name}.wav"
        try:
            generate_sfx(model, processor, config["prompt"], config["duration"], output_path)
        except Exception as e:
            print(f"  ERROR: {e}")
    
    print("-" * 60)
    print("Done! Consider converting to OGG for web compatibility.")


if __name__ == "__main__":
    main()
