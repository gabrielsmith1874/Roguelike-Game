
import os
import sys
from pathlib import Path
import torch
from transformers import AutoProcessor, MusicgenForConditionalGeneration, MusicgenConfig
import scipy.io.wavfile as wavfile

def main():
    print("Generating short sample music...")
    
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
        
    prompt = "8bit chiptune, medieval fantasy, dark theme, jump king style, atmospheric, retro game music, mysterious"
    duration = 10 # seconds
    
    base_name = "sample_menu"
    output_path = OUTPUT_DIR / f"{base_name}.wav"
    
    counter = 1
    while output_path.exists():
        output_path = OUTPUT_DIR / f"{base_name}_{counter}.wav"
        counter += 1
    
    print(f"Generating: {output_path.name}")
    print(f"  Prompt: {prompt}")
    print(f"  Duration: {duration}s")
    
    inputs = processor(
        text=[prompt],
        padding=True,
        return_tensors="pt",
    )
    
    device = "cuda" if torch.cuda.is_available() else "cpu"
    inputs = {k: v.to(device) for k, v in inputs.items()}
    model = model.to(device)
    
    tokens_per_second = 50
    max_tokens = duration * tokens_per_second
    
    with torch.no_grad():
        audio_values = model.generate(
            **inputs,
            max_new_tokens=max_tokens,
            do_sample=True,
            guidance_scale=3.0,
        )
        
    sample_rate = model.config.audio_encoder.sampling_rate
    audio_data = audio_values[0, 0].cpu().numpy()
    wavfile.write(str(output_path), sample_rate, audio_data)
    
    print(f"Saved: {output_path}")

if __name__ == "__main__":
    main()
