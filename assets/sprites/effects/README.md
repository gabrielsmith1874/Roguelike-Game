# Visual Effect Sprites

Place spell effects, explosions, and particle sprites here.

## Recommended Files

### Explosions & Impacts
- `explosion_fire.png` - Fire explosion (32x32, 6 frames)
- `explosion_ice.png` - Ice shatter (32x32, 6 frames)
- `explosion_lightning.png` - Electric burst (32x32, 4 frames)
- `impact_hit.png` - Generic hit effect (16x16, 4 frames)

### Status Effects
- `burn_effect.png` - Burning overlay (16x16, 4 frames loop)
- `freeze_effect.png` - Frozen overlay (16x16, 4 frames loop)
- `shock_effect.png` - Shocked sparks (16x16, 4 frames loop)
- `poison_effect.png` - Poison bubbles (16x16, 4 frames loop)

### Particles
- `particle_fire.png` - Fire particle (4x4 or 8x8)
- `particle_ice.png` - Ice particle (4x4 or 8x8)
- `particle_spark.png` - Electric spark (4x4)
- `particle_magic.png` - Generic magic particle (4x4)
- `particle_dust.png` - Dust/smoke (8x8)

### Auras & Buffs
- `aura_shield.png` - Shield buff effect (24x24, 4 frames loop)
- `aura_speed.png` - Speed buff (24x24, 4 frames loop)
- `aura_power.png` - Damage buff (24x24, 4 frames loop)
- `heal_effect.png` - Healing sparkles (24x24, 6 frames)

## Loading Example
```typescript
this.load.spritesheet('fx_explosion_fire', 'assets/sprites/effects/explosion_fire.png', {
  frameWidth: 32,
  frameHeight: 32,
});
```
