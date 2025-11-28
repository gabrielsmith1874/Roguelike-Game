# Projectile Sprites

Place spell and attack projectile sprites here.

## Recommended Files
- `fireball.png` - Fire projectile (16x16, 4 frames)
- `ice_shard.png` - Ice projectile (16x16, 4 frames)
- `lightning_bolt.png` - Lightning projectile (16x16, 4 frames)
- `arcane_missile.png` - Arcane projectile (8x8, 4 frames)
- `shadow_orb.png` - Shadow projectile (12x12, 4 frames)
- `nature_thorn.png` - Nature projectile (8x8, 2 frames)
- `enemy_fireball.png` - Enemy fire attack (12x12, 4 frames)

## Animation Notes
- Projectiles should loop continuously
- Include rotation frames OR rotate programmatically
- Consider adding trail/glow effects as separate sprites

## Loading Example
```typescript
this.load.spritesheet('spell_fireball', 'assets/sprites/projectiles/fireball.png', {
  frameWidth: 16,
  frameHeight: 16,
});
```
