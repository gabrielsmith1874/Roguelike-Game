/**
 * @file Constants.ts
 * @description Game-wide constants and configuration values.
 * 
 * ORGANIZATION:
 * - Group constants by category
 * - Use SCREAMING_SNAKE_CASE for constants
 * - Document any non-obvious values
 */

// =============================================================================
// DISPLAY
// =============================================================================

/** Base game resolution width in pixels (16:9 aspect ratio) */
export const GAME_WIDTH = 1280;

/** Base game resolution height in pixels (16:9 aspect ratio) */
export const GAME_HEIGHT = 720;

/** Tile size in pixels (16x16 pixel art style) */
export const TILE_SIZE = 16;

// =============================================================================
// GAMEPLAY
// =============================================================================

/** Player base movement speed (pixels per second) */
export const PLAYER_SPEED = 120;

/** Player base health points */
export const PLAYER_BASE_HEALTH = 100;

/** Player base mana points */
export const PLAYER_BASE_MANA = 100;

/** Mana regeneration rate per second */
export const MANA_REGEN_RATE = 5;

/** Invulnerability duration after taking damage (milliseconds) */
export const INVULN_DURATION = 1000;

/** Dodge roll duration (milliseconds) */
export const DODGE_DURATION = 300;

/** Dodge roll cooldown (milliseconds) */
export const DODGE_COOLDOWN = 500;

// =============================================================================
// DUNGEON GENERATION
// =============================================================================

/** Minimum rooms per floor */
export const MIN_ROOMS_PER_FLOOR = 6;

/** Maximum rooms per floor */
export const MAX_ROOMS_PER_FLOOR = 12;

/** Minimum room width in tiles */
export const MIN_ROOM_WIDTH = 7;

/** Maximum room width in tiles */
export const MAX_ROOM_WIDTH = 15;

/** Minimum room height in tiles */
export const MIN_ROOM_HEIGHT = 7;

/** Maximum room height in tiles */
export const MAX_ROOM_HEIGHT = 15;

// =============================================================================
// MAGIC SYSTEM
// =============================================================================

/** Maximum number of spells player can equip */
export const MAX_EQUIPPED_SPELLS = 4;

/** Spell projectile default speed */
export const SPELL_BASE_SPEED = 200;

/** Maximum active projectiles (for object pooling) */
export const MAX_PROJECTILES = 100;

// =============================================================================
// AUDIO
// =============================================================================

/** Master volume (0-1) */
export const DEFAULT_MASTER_VOLUME = 0.8;

/** Music volume (0-1) */
export const DEFAULT_MUSIC_VOLUME = 0.6;

/** SFX volume (0-1) */
export const DEFAULT_SFX_VOLUME = 0.8;

// =============================================================================
// DEPTH / Z-INDEX
// =============================================================================

/** Depth layers for rendering order */
export const DEPTH = {
  FLOOR: 0,
  FLOOR_DECORATIONS: 10,
  SHADOWS: 20,
  ITEMS: 30,
  ENTITIES: 40,
  PLAYER: 50,
  PROJECTILES: 60,
  EFFECTS: 70,
  WALLS: 80,
  UI: 100,
  OVERLAY: 110,
} as const;

// =============================================================================
// SCENE KEYS
// =============================================================================

/** Scene identifiers - use these instead of string literals */
export const SCENES = {
  BOOT: 'BootScene',
  PRELOAD: 'PreloadScene',
  MENU: 'MenuScene',
  GAME: 'GameScene',
  PAUSE: 'PauseScene',
  GAME_OVER: 'GameOverScene',
  VICTORY: 'VictoryScene',
} as const;

// =============================================================================
// EVENTS
// =============================================================================

/** Custom game events - use these instead of string literals */
export const EVENTS = {
  // Player events
  PLAYER_DAMAGED: 'player:damaged',
  PLAYER_HEALED: 'player:healed',
  PLAYER_DIED: 'player:died',
  PLAYER_MANA_CHANGED: 'player:mana-changed',
  
  // Combat events
  ENEMY_DAMAGED: 'enemy:damaged',
  ENEMY_KILLED: 'enemy:killed',
  SPELL_CAST: 'spell:cast',
  
  // Dungeon events
  ROOM_ENTERED: 'room:entered',
  ROOM_CLEARED: 'room:cleared',
  FLOOR_COMPLETED: 'floor:completed',
  
  // Game state events
  GAME_PAUSED: 'game:paused',
  GAME_RESUMED: 'game:resumed',
  
  // Item events
  ITEM_PICKED_UP: 'item:picked-up',
  ITEM_USED: 'item:used',
} as const;
