# UI Sprites

Place HUD and interface sprites here.

## Recommended Files

### Health & Mana
- `heart_full.png` - Full heart (16x16)
- `heart_half.png` - Half heart (16x16)
- `heart_empty.png` - Empty heart (16x16)
- `mana_bar_fill.png` - Mana bar fill (repeatable)
- `mana_bar_frame.png` - Mana bar border

### Spell Slots
- `spell_slot.png` - Empty spell slot frame (24x24 or 32x32)
- `spell_slot_active.png` - Selected slot highlight
- `spell_slot_cooldown.png` - Cooldown overlay
- `spell_icons.png` - Spritesheet of spell icons (16x16 each)

### Minimap
- `minimap_frame.png` - Minimap border
- `minimap_room.png` - Visited room icon (8x8)
- `minimap_room_current.png` - Current room (8x8)
- `minimap_room_boss.png` - Boss room icon (8x8)
- `minimap_player.png` - Player position marker (4x4)

### Buttons & Panels
- `button_normal.png` - Button normal state (9-slice)
- `button_hover.png` - Button hover state
- `button_pressed.png` - Button pressed state
- `panel.png` - UI panel background (9-slice)

### Misc UI
- `cursor.png` - Custom cursor (16x16)
- `damage_number_font.png` - Bitmap font for damage numbers
- `interaction_prompt.png` - "Press E" prompt icon

## 9-Slice Notes
For scalable UI elements, use 9-slice sprites:
```typescript
this.add.nineslice(x, y, 'panel', undefined, width, height, 8, 8, 8, 8);
```

## Loading Example
```typescript
this.load.image('ui_heart_full', 'assets/sprites/ui/heart_full.png');
this.load.spritesheet('ui_spell_icons', 'assets/sprites/ui/spell_icons.png', {
  frameWidth: 16,
  frameHeight: 16,
});
```
