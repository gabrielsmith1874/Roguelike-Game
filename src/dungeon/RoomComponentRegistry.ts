/**
 * @file RoomComponentRegistry.ts
 * @description Registry for room components loaded from JSON files.
 * Handles loading, caching, and querying room components.
 */

import { 
  RoomComponentData, 
  RoomConstraints, 
  roomMatchesConstraints,
  getOppositeDirection 
} from './RoomComponent';
import { RoomType, DoorDirection } from './Room';
import { SeededRandom } from '@utils/Random';

/**
 * Registry for all loaded room components.
 * 
 * Usage:
 * 1. Load room components in PreloadScene
 * 2. Register them with RoomComponentRegistry.register()
 * 3. Query for matching rooms with findMatching()
 * 
 * @example
 * ```ts
 * // In PreloadScene
 * this.load.json('rooms', 'assets/data/rooms/index.json');
 * 
 * // After loading
 * const roomData = this.cache.json.get('rooms');
 * RoomComponentRegistry.loadFromJSON(roomData);
 * 
 * // When player enters a door going NORTH
 * const nextRoom = RoomComponentRegistry.findMatching({
 *   requiredDoor: DoorDirection.SOUTH, // New room needs south door to connect
 *   floorNumber: 1,
 *   maxDifficulty: 3,
 * }, rng);
 * ```
 */
export class RoomComponentRegistry {
  private static components: Map<string, RoomComponentData> = new Map();
  
  /** Index by room type for faster queries */
  private static byType: Map<RoomType, RoomComponentData[]> = new Map();
  
  /** Index by door direction for faster queries */
  private static byDoor: Map<DoorDirection, RoomComponentData[]> = new Map();
  
  /**
   * Register a single room component.
   */
  public static register(component: RoomComponentData): void {
    // Validate
    if (!component.id || !component.tiles || !component.doorSlots) {
      console.error('Invalid room component:', component);
      return;
    }
    
    // Store in main map
    this.components.set(component.id, component);
    
    // Index by type
    if (!this.byType.has(component.type)) {
      this.byType.set(component.type, []);
    }
    this.byType.get(component.type)!.push(component);
    
    // Index by available door directions
    for (const slot of component.doorSlots) {
      if (!this.byDoor.has(slot.direction)) {
        this.byDoor.set(slot.direction, []);
      }
      const list = this.byDoor.get(slot.direction)!;
      if (!list.includes(component)) {
        list.push(component);
      }
    }
  }
  
  /**
   * Load room components from JSON data.
   */
  public static loadFromJSON(data: { rooms: RoomComponentData[] }): void {
    this.clear();
    
    for (const room of data.rooms) {
      this.register(room);
    }
    
    console.info(`Loaded ${data.rooms.length} room components`);
  }
  
  /**
   * Get a room component by ID.
   */
  public static get(id: string): RoomComponentData | undefined {
    return this.components.get(id);
  }
  
  /**
   * Get all room components.
   */
  public static getAll(): RoomComponentData[] {
    return Array.from(this.components.values());
  }
  
  /**
   * Get all room components of a specific type.
   */
  public static getByType(type: RoomType): RoomComponentData[] {
    return this.byType.get(type) ?? [];
  }
  
  /**
   * Get all room components that have a door in a specific direction.
   */
  public static getByDoor(direction: DoorDirection): RoomComponentData[] {
    return this.byDoor.get(direction) ?? [];
  }
  
  /**
   * Find all room components matching constraints.
   */
  public static findAllMatching(constraints: RoomConstraints): RoomComponentData[] {
    // Start with rooms that have the required door
    const candidates = this.getByDoor(constraints.requiredDoor);
    
    // Filter by all constraints
    return candidates.filter((room) => roomMatchesConstraints(room, constraints));
  }
  
  /**
   * Find a random room component matching constraints.
   * Uses weighted random selection based on room weights.
   */
  public static findMatching(
    constraints: RoomConstraints,
    rng: SeededRandom
  ): RoomComponentData | null {
    const matching = this.findAllMatching(constraints);
    
    if (matching.length === 0) {
      console.warn('No room components match constraints:', constraints);
      return null;
    }
    
    // Weighted random selection
    const weights = matching.map((r) => r.weight ?? 1);
    return rng.weightedPick(matching, weights);
  }
  
  /**
   * Find a room to connect through a specific door direction.
   * This is the main method for on-demand generation.
   * 
   * @param fromDirection - The direction the player is traveling (e.g., NORTH means going up)
   * @param constraints - Additional constraints for room selection
   * @param rng - Seeded random generator
   */
  public static findForDoor(
    fromDirection: DoorDirection,
    constraints: Partial<RoomConstraints>,
    rng: SeededRandom
  ): RoomComponentData | null {
    // New room needs a door in the opposite direction to connect back
    const requiredDoor = getOppositeDirection(fromDirection);
    
    const fullConstraints: RoomConstraints = {
      ...constraints,
      requiredDoor,
    };
    
    return this.findMatching(fullConstraints, rng);
  }
  
  /**
   * Get room count.
   */
  public static count(): number {
    return this.components.size;
  }
  
  /**
   * Clear all registered components.
   */
  public static clear(): void {
    this.components.clear();
    this.byType.clear();
    this.byDoor.clear();
  }
}
