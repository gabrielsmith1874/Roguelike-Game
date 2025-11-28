# Player Sprites

Place player character spritesheets here.

## Recommended Structure
- `wizard.png` - Main wizard character spritesheet
- `wizard.json` - Aseprite/TexturePacker JSON data (optional)

## Spritesheet Layout (16x16 per frame)
- **Row 0**: Idle animation (4 frames)
- **Row 1**: Walk down (4 frames)
- **Row 2**: Walk up (4 frames)
- **Row 3**: Walk right (4 frames) - flip for left
- **Row 4**: Cast animation (4 frames)
- **Row 5**: Dodge roll (4 frames)
- **Row 6**: Hurt (2 frames)
- **Row 7**: Death (4 frames)

## Loading in Phaser
```typescript
this.load.spritesheet('player', 'assets/sprites/player/wizard.png', {
  frameWidth: 16,
  frameHeight: 16,
});
```
