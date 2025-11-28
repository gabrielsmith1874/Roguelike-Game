# Item Sprites

Place item and pickup sprites here. Items are typically static or have simple animations.

## Recommended Files

### Consumables
- `health_potion.png` - Red potion (16x16)
- `mana_potion.png` - Blue potion (16x16)
- `key.png` - Dungeon key (16x16)

### Equipment/Passive Items
- `speed_boots.png` - Swift boots (16x16)
- `fire_ring.png` - Ring of flames (16x16)
- `ice_amulet.png` - Frost amulet (16x16)
- `lightning_staff.png` - Staff item (16x16)

### Pickups
- `gold_coin.png` - Gold coin (8x8 or 16x16, 4 frames spin)
- `gold_pile.png` - Pile of gold (16x16)
- `heart.png` - Health pickup (16x16, 2 frames pulse)
- `mana_orb.png` - Mana pickup (16x16, 4 frames glow)

### Interactables
- `chest_closed.png` - Closed chest (16x16)
- `chest_open.png` - Open chest (16x16)
- `chest_mimic.png` - Mimic variant (16x16)

## Item Rarity Variants (optional)
Create color-coded variants for different rarities:
- Common: Gray/White outline
- Uncommon: Green outline
- Rare: Blue outline
- Epic: Purple outline
- Legendary: Orange/Gold outline

## Loading Example
```typescript
this.load.image('item_health_potion', 'assets/sprites/items/health_potion.png');
this.load.spritesheet('item_coin', 'assets/sprites/items/gold_coin.png', {
  frameWidth: 8,
  frameHeight: 8,
});
```
