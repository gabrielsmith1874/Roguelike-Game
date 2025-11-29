# Player Sprites

Wizard character sprites in Realm of the Mad God style (32x32 minimalist pixel art).

## Current Sprites
Generated via PixelLab MCP - Character ID: `df64b530-7c91-4f18-8742-76dbe1960c91`

### Rotations (8 directions)
Located in `rotations/` folder:
- `south.png` - Facing down
- `north.png` - Facing up
- `east.png` - Facing right
- `west.png` - Facing left
- `south-east.png` - Facing down-right
- `south-west.png` - Facing down-left
- `north-east.png` - Facing up-right
- `north-west.png` - Facing up-left

### Specifications
- **Canvas Size**: 32×32px
- **Character Size**: ~19px tall, ~14px wide
- **Style**: Flat shading, black outline, low detail
- **View**: High top-down

## Loading in Phaser
```typescript
// Load individual rotation sprites
const directions = ['south', 'north', 'east', 'west', 'south-east', 'south-west', 'north-east', 'north-west'];
directions.forEach(dir => {
  this.load.image(`player-${dir}`, `assets/sprites/player/rotations/${dir}.png`);
});
```
