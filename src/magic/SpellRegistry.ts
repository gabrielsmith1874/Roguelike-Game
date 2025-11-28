/**
 * @file SpellRegistry.ts
 * @description Central registry for all spell definitions.
 * Spell data is loaded from JSON and registered here.
 */

import type { SpellData } from './Spell';

/**
 * Spell Registry - stores all spell definitions.
 * 
 * Usage:
 * 1. Load spell data from JSON in PreloadScene
 * 2. Call SpellRegistry.loadFromJSON(data)
 * 3. Access spells via SpellRegistry.get(id)
 * 
 * @example
 * ```ts
 * // In PreloadScene:
 * this.load.json('spells', 'assets/data/spells.json');
 * 
 * // In create:
 * const spellData = this.cache.json.get('spells');
 * SpellRegistry.loadFromJSON(spellData);
 * 
 * // Anywhere:
 * const fireball = SpellRegistry.get('fireball');
 * ```
 */
export class SpellRegistry {
  private static spells: Map<string, SpellData> = new Map();
  
  /**
   * Register a single spell.
   */
  public static register(data: SpellData): void {
    if (this.spells.has(data.id)) {
      console.warn(`Overwriting spell: ${data.id}`);
    }
    this.spells.set(data.id, data);
  }
  
  /**
   * Load spells from JSON data.
   */
  public static loadFromJSON(data: { spells: SpellData[] }): void {
    for (const spell of data.spells) {
      this.register(spell);
    }
    console.info(`Loaded ${data.spells.length} spells`);
  }
  
  /**
   * Get a spell by ID.
   */
  public static get(id: string): SpellData | undefined {
    return this.spells.get(id);
  }
  
  /**
   * Check if a spell exists.
   */
  public static has(id: string): boolean {
    return this.spells.has(id);
  }
  
  /**
   * Get all spells.
   */
  public static getAll(): SpellData[] {
    return Array.from(this.spells.values());
  }
  
  /**
   * Get spells by element.
   */
  public static getByElement(element: string): SpellData[] {
    return this.getAll().filter((spell) => spell.element === element);
  }
  
  /**
   * Get spells by rarity.
   */
  public static getByRarity(rarity: string): SpellData[] {
    return this.getAll().filter((spell) => spell.rarity === rarity);
  }
  
  /**
   * Get a random spell (for drops, etc).
   */
  public static getRandom(): SpellData | undefined {
    const all = this.getAll();
    if (all.length === 0) return undefined;
    return all[Math.floor(Math.random() * all.length)];
  }
  
  /**
   * Clear all registered spells.
   */
  public static clear(): void {
    this.spells.clear();
  }
}
