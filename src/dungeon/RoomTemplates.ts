/**
 * @file RoomTemplates.ts
 * @description Pre-designed room templates for dungeon generation.
 */

import { RoomType } from './Room';

/**
 * Tile types for room templates.
 */
export enum TileType {
  FLOOR = 0,
  WALL = 1,
  DOOR = 2,
  PIT = 3,
  SPIKE = 4,
  CHEST_SPAWN = 5,
  ENEMY_SPAWN = 6,
  PLAYER_SPAWN = 7,
  DECORATION = 8,
}

/**
 * Room template definition.
 */
export interface RoomTemplate {
  id: string;
  name: string;
  type: RoomType;
  width: number;
  height: number;
  tiles: number[][];
  enemyCount: { min: number; max: number };
  difficulty: number; // 1-10
}

/**
 * Room template registry.
 * 
 * Templates use 2D number arrays where each number
 * corresponds to a TileType.
 * 
 * Add new templates here or load from JSON.
 */
export class RoomTemplates {
  private static templates: Map<string, RoomTemplate> = new Map();
  
  /**
   * Initialize default templates.
   */
  public static initialize(): void {
    // Basic small room (7x7)
    this.register({
      id: 'basic_small',
      name: 'Basic Small Room',
      type: RoomType.NORMAL,
      width: 7,
      height: 7,
      tiles: [
        [1, 1, 1, 2, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 0, 6, 0, 6, 0, 1],
        [2, 0, 0, 0, 0, 0, 2],
        [1, 0, 6, 0, 6, 0, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 2, 1, 1, 1],
      ],
      enemyCount: { min: 2, max: 4 },
      difficulty: 1,
    });
    
    // Medium room with pillars (9x9)
    this.register({
      id: 'pillar_medium',
      name: 'Pillar Room',
      type: RoomType.NORMAL,
      width: 9,
      height: 9,
      tiles: [
        [1, 1, 1, 1, 2, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 0, 0, 1, 0, 1],
        [1, 0, 0, 0, 6, 0, 0, 0, 1],
        [2, 0, 0, 6, 0, 6, 0, 0, 2],
        [1, 0, 0, 0, 6, 0, 0, 0, 1],
        [1, 0, 1, 0, 0, 0, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 2, 1, 1, 1, 1],
      ],
      enemyCount: { min: 3, max: 5 },
      difficulty: 2,
    });
    
    // Start room (safe)
    this.register({
      id: 'start_basic',
      name: 'Starting Room',
      type: RoomType.START,
      width: 7,
      height: 7,
      tiles: [
        [1, 1, 1, 2, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [2, 0, 0, 7, 0, 0, 2],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 2, 1, 1, 1],
      ],
      enemyCount: { min: 0, max: 0 },
      difficulty: 0,
    });
    
    // Boss room (large)
    this.register({
      id: 'boss_basic',
      name: 'Boss Arena',
      type: RoomType.BOSS,
      width: 15,
      height: 11,
      tiles: [
        [1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [2, 0, 0, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 2],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1],
      ],
      enemyCount: { min: 1, max: 1 }, // Boss only
      difficulty: 10,
    });
    
    // Treasure room
    this.register({
      id: 'treasure_basic',
      name: 'Treasure Room',
      type: RoomType.TREASURE,
      width: 7,
      height: 7,
      tiles: [
        [1, 1, 1, 2, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 0, 8, 0, 8, 0, 1],
        [2, 0, 0, 5, 0, 0, 1],
        [1, 0, 8, 0, 8, 0, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1],
      ],
      enemyCount: { min: 0, max: 0 },
      difficulty: 0,
    });
  }
  
  /**
   * Register a room template.
   */
  public static register(template: RoomTemplate): void {
    this.templates.set(template.id, template);
  }
  
  /**
   * Get a template by ID.
   */
  public static get(id: string): RoomTemplate | undefined {
    return this.templates.get(id);
  }
  
  /**
   * Get all templates for a room type.
   */
  public static getByType(type: RoomType): RoomTemplate[] {
    return Array.from(this.templates.values())
      .filter((t) => t.type === type);
  }
  
  /**
   * Get a random template for a room type.
   */
  public static getRandom(type: RoomType): RoomTemplate | undefined {
    const templates = this.getByType(type);
    if (templates.length === 0) return undefined;
    return templates[Math.floor(Math.random() * templates.length)];
  }
  
  /**
   * Get templates by difficulty range.
   */
  public static getByDifficulty(min: number, max: number): RoomTemplate[] {
    return Array.from(this.templates.values())
      .filter((t) => t.difficulty >= min && t.difficulty <= max);
  }
  
  /**
   * Load templates from JSON.
   */
  public static loadFromJSON(data: { templates: RoomTemplate[] }): void {
    for (const template of data.templates) {
      this.register(template);
    }
  }
}
