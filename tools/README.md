# Audio Generation Tools

This folder contains scripts to generate game audio using AI models.

## Setup

### Prerequisites
- Python 3.9+
- CUDA-capable GPU (recommended, but CPU works slowly)
- ~4GB disk space for models

### Install Dependencies
```bash
pip install torch torchaudio transformers scipy

# For GPU acceleration (NVIDIA):
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu118
```

## Generate Music

Uses Meta's **MusicGen** model to create background music.

```bash
cd tools
python generate-music.py
```

Generated tracks:
- `menu.wav` - Main menu ambient
- `dungeon_floor1.wav` - First floor exploration
- `dungeon_floor2.wav` - Deeper dungeon music
- `boss.wav` - Boss battle theme
- `victory.wav` - Victory fanfare
- `game_over.wav` - Game over music

### Convert to MP3/OGG (smaller files)
```bash
# MP3 (requires ffmpeg)
ffmpeg -i menu.wav -b:a 128k menu.mp3

# OGG (better for web)
ffmpeg -i menu.wav -c:a libvorbis -q:a 4 menu.ogg
```

## Generate Sound Effects

Uses **MusicGen** (or AudioGen if available) for sound effects.

```bash
python generate-sfx.py
```

Generated effects:
- Spell sounds (fire, ice, lightning, arcane)
- Combat sounds (hit, explosion, death)
- Item pickups (coin, health, mana)
- UI sounds (click, hover, level up)
- Environment (door, footstep)

## Alternative: Procedural SFX (No AI needed!)

For retro-style sound effects, the game includes `ProceduralSFX.ts` which generates sounds at runtime using the sfxr algorithm. No external files needed!

```typescript
import { getProceduralSFX } from '@audio/ProceduralSFX';

const sfx = getProceduralSFX();
sfx.init(); // Call after user interaction

// Play preset sounds
sfx.play('spell_fire');
sfx.play('pickup_coin');
sfx.play('explosion');

// Generate random sounds
const customParams = sfx.randomize('laser');
sfx.play(customParams);
```

## Model Options

### MusicGen Variants
| Model | VRAM | Quality | Speed |
|-------|------|---------|-------|
| `facebook/musicgen-small` | ~4GB | Good | Fast |
| `facebook/musicgen-medium` | ~8GB | Better | Medium |
| `facebook/musicgen-large` | ~16GB | Best | Slow |

### Tips
- Start with `musicgen-small` for testing
- Generate multiple variations and pick the best
- Post-process with Audacity for looping/trimming
- Use `guidance_scale` parameter (1-5) to control prompt adherence

## Custom Prompts

Edit the `MUSIC_PROMPTS` dict in `generate-music.py` to customize:

```python
MUSIC_PROMPTS = {
    "my_track": {
        "prompt": "epic orchestral battle music, fast tempo, brass and drums",
        "duration": 45,
    },
}
```

Good prompt tips:
- Be specific about instruments
- Mention tempo (slow, fast, moderate)
- Include mood/atmosphere
- Reference genres if helpful

## Troubleshooting

### "CUDA out of memory"
- Use a smaller model
- Reduce `max_new_tokens`
- Close other GPU applications

### "Model not found"
```bash
huggingface-cli login
# Enter your HuggingFace token
```

### Slow generation on CPU
- Expected: ~5 minutes per 30s track on CPU
- With GPU: ~30 seconds per 30s track
