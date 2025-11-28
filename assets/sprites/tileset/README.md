# Tileset Sprites

Place dungeon tileset sprites here for room rendering.

## Recommended Files

### Main Tileset
- `dungeon_tileset.png` - Main tileset (16x16 per tile)
- `dungeon_tileset.json` - Tiled tileset data (optional)

### Tileset Layout (Example 16 columns)
```
Row 0: Floor variants (stone, cracked, mossy, etc.)
Row 1: Wall tops (north-facing walls)
Row 2: Wall sides (east/west walls)
Row 3: Wall corners (NW, NE, SW, SE)
Row 4: Doors (closed N/S, closed E/W, open N/S, open E/W)
Row 5: Pits and hazards (pit, spikes, lava)
Row 6: Decorations (cracks, moss, bones, cobwebs)
Row 7: Special tiles (pressure plate, torch, grate)
```

### Alternative Tilesets (for variety)
- `tileset_cave.png` - Cave/natural theme
- `tileset_crypt.png` - Undead/tomb theme
- `tileset_fire.png` - Fire/lava theme
- `tileset_ice.png` - Ice/frozen theme

### Tile Index Reference
```
0  = Floor (basic)
1  = Wall (solid)
2  = Door
3  = Pit (fall damage)
4  = Spikes (damage)
5  = Chest spawn marker (replaced at runtime)
6  = Enemy spawn marker (replaced at runtime)
7  = Player spawn marker (replaced at runtime)
8  = Decoration
```

## Loading Example
```typescript
this.load.image('tiles', 'assets/sprites/tileset/dungeon_tileset.png');

// If using Tiled:
this.load.tilemapTiledJSON('room', 'assets/tilemaps/room.json');
```

## Tiled Editor Setup
1. Create tileset in Tiled with 16x16 tile size
2. Set proper tile properties (collision, etc.)
3. Export as JSON for Phaser
