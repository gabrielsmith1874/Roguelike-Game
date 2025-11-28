# Enemy Sprites

Place enemy spritesheets here.

## Recommended Files
- `slime.png` - Slime enemy (16x16)
- `skeleton.png` - Skeleton warrior (16x16)
- `imp.png` - Fire imp (16x16)
- `ghost.png` - Ghost enemy (16x16)
- `golem.png` - Stone golem (16x24 or 24x24)
- `bosses/flame_lord.png` - Boss sprite (32x32 or larger)

## Spritesheet Layout Per Enemy
- **Row 0**: Idle (4 frames)
- **Row 1**: Move (4 frames)
- **Row 2**: Attack (4 frames)
- **Row 3**: Hurt (2 frames)
- **Row 4**: Death (4 frames)

## Loading Example
```typescript
this.load.spritesheet('enemy_slime', 'assets/sprites/enemies/slime.png', {
  frameWidth: 16,
  frameHeight: 16,
});
```
