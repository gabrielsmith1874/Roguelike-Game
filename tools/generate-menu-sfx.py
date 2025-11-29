
import os
import sys
from pathlib import Path
import torch
from transformers import AutoProcessor, MusicgenForConditionalGeneration, MusicgenConfig
import scipy.io.wavfile as wavfile

def generate_sfx(model, processor, prompt: str, duration: float, base_name: str, output_dir: Path):
    print(f"Generating: {base_name}")
    print(f"  Prompt: {prompt}")
    
    inputs = processor(
        text=[prompt],
        padding=True,
        return_tensors="pt",
    )
    
    device = "cuda" if torch.cuda.is_available() else "cpu"
    inputs = {k: v.to(device) for k, v in inputs.items()}
    model = model.to(device)
    
    # MusicGen small is 50 tokens/sec
    tokens_per_second = 50
    max_tokens = max(int(duration * tokens_per_second), 25) # Ensure at least some tokens
    
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
        
    # Unique filename logic
    output_path = output_dir / f"{base_name}.wav"
    counter = 1
    while output_path.exists():
        output_path = output_dir / f"{base_name}_{counter}.wav"
        counter += 1
    
    wavfile.write(str(output_path), sample_rate, audio_data)
    print(f"  Saved: {output_path}")

def main():
    print("Generating Menu SFX...")
    
    # Output directory
    OUTPUT_DIR = Path(__file__).parent / "output"
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    model_name = "facebook/musicgen-small"
    
    try:
        # Fix for transformers bug
        MusicgenForConditionalGeneration.config_class = MusicgenConfig
        
        print(f"Loading model: {model_name}")
        processor = AutoProcessor.from_pretrained(model_name)
        model = MusicgenForConditionalGeneration.from_pretrained(model_name)
    except Exception as e:
        print(f"Error loading model: {e}")
        sys.exit(1)
        
    # Prompts for menu clicks
    # 8bit/retro style to match the music
    prompts = [
        ("menu_click_retro", "8bit retro ui click, short blip, nes style select sound"),
        ("menu_click_wood", "wooden percussion click, organic ui sound, medieval ui select"),
        ("menu_click_magic", "subtle magical chime, fantasy ui click, soft sparkle"),
        ("menu_back", "8bit low pitch blip, cancel sound, retro ui back"),
        ("menu_hover", "short 8bit noise, ui hover sound, retro glitch")
    ]
    
    for name, prompt in prompts:
        generate_sfx(model, processor, prompt, 0.5, name, OUTPUT_DIR)

if __name__ == "__main__":
    main()
