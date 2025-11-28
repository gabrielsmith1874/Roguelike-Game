/**
 * @file PlaceholderSprites.ts
 * @description Generates placeholder sprite textures at runtime.
 * Use this during development before real sprites are ready.
 * 
 * All placeholders are simple colored shapes that indicate their purpose.
 */

import Phaser from 'phaser';

/**
 * Placeholder sprite definitions.
 */
interface PlaceholderDef {
  key: string;
  width: number;
  height: number;
  color: number;
  type: 'rect' | 'circle' | 'diamond' | 'triangle';
  frames?: number;
  label?: string;
}

/**
 * All placeholder sprites the game needs.
 * Add new entries here as you add features.
 */
const PLACEHOLDERS: PlaceholderDef[] = [
  // ===========================================
  // PLAYER
  // ===========================================
  { key: 'player_wizard', width: 16, height: 16, color: 0x6366f1, type: 'rect', label: 'W' },
  { key: 'player_pyro', width: 16, height: 16, color: 0xef4444, type: 'rect', label: 'P' },
  { key: 'player_cryo', width: 16, height: 16, color: 0x3b82f6, type: 'rect', label: 'C' },
  { key: 'player_storm', width: 16, height: 16, color: 0xfbbf24, type: 'rect', label: 'S' },
  { key: 'player_shadow', width: 16, height: 16, color: 0x7c3aed, type: 'rect', label: 'X' },
  
  // ===========================================
  // ENEMIES
  // ===========================================
  { key: 'enemy_slime', width: 16, height: 16, color: 0x22c55e, type: 'circle', label: 'S' },
  { key: 'enemy_skeleton', width: 16, height: 16, color: 0xf5f5f4, type: 'rect', label: 'K' },
  { key: 'enemy_imp', width: 16, height: 16, color: 0xef4444, type: 'triangle', label: 'I' },
  { key: 'enemy_ghost', width: 16, height: 16, color: 0x94a3b8, type: 'circle', label: 'G' },
  { key: 'enemy_golem', width: 20, height: 20, color: 0x78716c, type: 'rect', label: 'G' },
  
  // ===========================================
  // BOSSES
  // ===========================================
  { key: 'boss_flame_lord', width: 32, height: 32, color: 0xdc2626, type: 'diamond', label: 'FL' },
  { key: 'boss_frost_queen', width: 32, height: 32, color: 0x0ea5e9, type: 'diamond', label: 'FQ' },
  
  // ===========================================
  // PROJECTILES
  // ===========================================
  { key: 'spell_fireball', width: 12, height: 12, color: 0xff6b35, type: 'circle' },
  { key: 'spell_ice_shard', width: 10, height: 10, color: 0x67e8f9, type: 'diamond' },
  { key: 'spell_lightning', width: 8, height: 16, color: 0xfde047, type: 'rect' },
  { key: 'spell_arcane_missile', width: 8, height: 8, color: 0xa855f7, type: 'circle' },
  { key: 'spell_shadow_orb', width: 10, height: 10, color: 0x581c87, type: 'circle' },
  { key: 'spell_nature_thorn', width: 8, height: 8, color: 0x22c55e, type: 'triangle' },
  { key: 'enemy_projectile', width: 8, height: 8, color: 0xef4444, type: 'circle' },
  
  // ===========================================
  // EFFECTS
  // ===========================================
  { key: 'fx_explosion_fire', width: 32, height: 32, color: 0xf97316, type: 'circle' },
  { key: 'fx_explosion_ice', width: 32, height: 32, color: 0x38bdf8, type: 'circle' },
  { key: 'fx_hit', width: 16, height: 16, color: 0xffffff, type: 'circle' },
  { key: 'fx_heal', width: 16, height: 16, color: 0x4ade80, type: 'circle' },
  { key: 'particle', width: 4, height: 4, color: 0xffffff, type: 'circle' },
  
  // ===========================================
  // ITEMS
  // ===========================================
  { key: 'item_health_potion', width: 12, height: 14, color: 0xef4444, type: 'rect', label: 'H' },
  { key: 'item_mana_potion', width: 12, height: 14, color: 0x3b82f6, type: 'rect', label: 'M' },
  { key: 'item_key', width: 10, height: 14, color: 0xfbbf24, type: 'rect', label: 'K' },
  { key: 'item_coin', width: 10, height: 10, color: 0xfcd34d, type: 'circle' },
  { key: 'item_heart', width: 14, height: 12, color: 0xef4444, type: 'diamond' },
  { key: 'item_chest', width: 16, height: 14, color: 0xb45309, type: 'rect', label: 'C' },
  { key: 'item_chest_open', width: 16, height: 14, color: 0x78350f, type: 'rect', label: 'O' },
  
  // ===========================================
  // UI
  // ===========================================
  { key: 'ui_heart_full', width: 12, height: 12, color: 0xef4444, type: 'diamond' },
  { key: 'ui_heart_half', width: 12, height: 12, color: 0xf87171, type: 'diamond' },
  { key: 'ui_heart_empty', width: 12, height: 12, color: 0x374151, type: 'diamond' },
  { key: 'ui_mana_orb', width: 10, height: 10, color: 0x3b82f6, type: 'circle' },
  { key: 'ui_spell_slot', width: 24, height: 24, color: 0x1f2937, type: 'rect' },
  { key: 'ui_minimap_room', width: 8, height: 8, color: 0x6b7280, type: 'rect' },
  { key: 'ui_minimap_current', width: 8, height: 8, color: 0x22c55e, type: 'rect' },
  { key: 'ui_minimap_boss', width: 8, height: 8, color: 0xef4444, type: 'rect' },
  
  // ===========================================
  // TILESET
  // ===========================================
  { key: 'tile_floor', width: 16, height: 16, color: 0x374151, type: 'rect' },
  { key: 'tile_wall', width: 16, height: 16, color: 0x1f2937, type: 'rect' },
  { key: 'tile_door_closed', width: 16, height: 16, color: 0x78350f, type: 'rect', label: 'D' },
  { key: 'tile_door_open', width: 16, height: 16, color: 0x451a03, type: 'rect' },
  { key: 'tile_pit', width: 16, height: 16, color: 0x0f0f0f, type: 'rect' },
  { key: 'tile_spikes', width: 16, height: 16, color: 0x71717a, type: 'triangle' },
];

/**
 * Generate all placeholder sprites.
 * Call this in BootScene or PreloadScene.
 */
export function generatePlaceholders(scene: Phaser.Scene): void {
  for (const def of PLACEHOLDERS) {
    // Skip if texture already exists (real sprite loaded)
    if (scene.textures.exists(def.key)) {
      continue;
    }
    
    generatePlaceholder(scene, def);
  }
  
  console.info(`Generated ${PLACEHOLDERS.length} placeholder sprites`);
}

/**
 * Generate a single placeholder sprite.
 */
function generatePlaceholder(scene: Phaser.Scene, def: PlaceholderDef): void {
  const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
  
  // Draw shape based on type
  switch (def.type) {
    case 'rect':
      // Filled rectangle with border
      graphics.fillStyle(def.color, 1);
      graphics.fillRect(1, 1, def.width - 2, def.height - 2);
      graphics.lineStyle(1, 0x000000, 0.5);
      graphics.strokeRect(0, 0, def.width, def.height);
      break;
      
    case 'circle':
      // Filled circle
      graphics.fillStyle(def.color, 1);
      graphics.fillCircle(def.width / 2, def.height / 2, Math.min(def.width, def.height) / 2 - 1);
      graphics.lineStyle(1, 0x000000, 0.3);
      graphics.strokeCircle(def.width / 2, def.height / 2, Math.min(def.width, def.height) / 2 - 1);
      break;
      
    case 'diamond':
      // Diamond shape
      graphics.fillStyle(def.color, 1);
      graphics.beginPath();
      graphics.moveTo(def.width / 2, 1);
      graphics.lineTo(def.width - 1, def.height / 2);
      graphics.lineTo(def.width / 2, def.height - 1);
      graphics.lineTo(1, def.height / 2);
      graphics.closePath();
      graphics.fillPath();
      break;
      
    case 'triangle':
      // Triangle pointing up
      graphics.fillStyle(def.color, 1);
      graphics.beginPath();
      graphics.moveTo(def.width / 2, 1);
      graphics.lineTo(def.width - 1, def.height - 1);
      graphics.lineTo(1, def.height - 1);
      graphics.closePath();
      graphics.fillPath();
      break;
  }
  
  // Add label if provided
  if (def.label) {
    // We can't easily add text to graphics, so we'll skip labels in textures
    // Labels are mainly for documentation purposes
  }
  
  // Generate texture from graphics
  graphics.generateTexture(def.key, def.width, def.height);
  graphics.destroy();
}

/**
 * Get a list of all placeholder keys.
 * Useful for debugging or listing available sprites.
 */
export function getPlaceholderKeys(): string[] {
  return PLACEHOLDERS.map(p => p.key);
}

/**
 * Check if a key is a placeholder.
 */
export function isPlaceholder(key: string): boolean {
  return PLACEHOLDERS.some(p => p.key === key);
}

/**
 * Sprite key constants for type safety.
 * Use these instead of string literals.
 */
export const SPRITES = {
  // Player
  PLAYER_WIZARD: 'player_wizard',
  PLAYER_PYRO: 'player_pyro',
  PLAYER_CRYO: 'player_cryo',
  PLAYER_STORM: 'player_storm',
  PLAYER_SHADOW: 'player_shadow',
  
  // Enemies
  ENEMY_SLIME: 'enemy_slime',
  ENEMY_SKELETON: 'enemy_skeleton',
  ENEMY_IMP: 'enemy_imp',
  ENEMY_GHOST: 'enemy_ghost',
  ENEMY_GOLEM: 'enemy_golem',
  
  // Bosses
  BOSS_FLAME_LORD: 'boss_flame_lord',
  BOSS_FROST_QUEEN: 'boss_frost_queen',
  
  // Projectiles
  SPELL_FIREBALL: 'spell_fireball',
  SPELL_ICE_SHARD: 'spell_ice_shard',
  SPELL_LIGHTNING: 'spell_lightning',
  SPELL_ARCANE_MISSILE: 'spell_arcane_missile',
  SPELL_SHADOW_ORB: 'spell_shadow_orb',
  SPELL_NATURE_THORN: 'spell_nature_thorn',
  ENEMY_PROJECTILE: 'enemy_projectile',
  
  // Effects
  FX_EXPLOSION_FIRE: 'fx_explosion_fire',
  FX_EXPLOSION_ICE: 'fx_explosion_ice',
  FX_HIT: 'fx_hit',
  FX_HEAL: 'fx_heal',
  PARTICLE: 'particle',
  
  // Items
  ITEM_HEALTH_POTION: 'item_health_potion',
  ITEM_MANA_POTION: 'item_mana_potion',
  ITEM_KEY: 'item_key',
  ITEM_COIN: 'item_coin',
  ITEM_HEART: 'item_heart',
  ITEM_CHEST: 'item_chest',
  ITEM_CHEST_OPEN: 'item_chest_open',
  
  // UI
  UI_HEART_FULL: 'ui_heart_full',
  UI_HEART_HALF: 'ui_heart_half',
  UI_HEART_EMPTY: 'ui_heart_empty',
  UI_MANA_ORB: 'ui_mana_orb',
  UI_SPELL_SLOT: 'ui_spell_slot',
  UI_MINIMAP_ROOM: 'ui_minimap_room',
  UI_MINIMAP_CURRENT: 'ui_minimap_current',
  UI_MINIMAP_BOSS: 'ui_minimap_boss',
  
  // Tiles
  TILE_FLOOR: 'tile_floor',
  TILE_WALL: 'tile_wall',
  TILE_DOOR_CLOSED: 'tile_door_closed',
  TILE_DOOR_OPEN: 'tile_door_open',
  TILE_PIT: 'tile_pit',
  TILE_SPIKES: 'tile_spikes',
} as const;
