/**
 * @file RoomComponent.ts
 * @description Room component definition - represents a loadable room template.
 * Room components are JSON files that define room layouts, enemy spawns, etc.
 */

import { RoomType, DoorDirection } from './Room';

// TileType values used in tile arrays:
// 0 = FLOOR, 1 = WALL, 2 = DOOR, 3 = PIT, 4 = SPIKE, 
// 5 = CHEST_SPAWN, 6 = ENEMY_SPAWN, 7 = PLAYER_SPAWN, 8 = DECORATION

/**
 * Door slot definition - where doors CAN be placed on a room component.
 * Not all slots need to be active; they define possible connection points.
 */
export interface DoorSlot {
  direction: DoorDirection;
  /** Position along the wall (0-1, where 0.5 is center) */
  position: number;
  /** Whether this slot MUST have a door (required for connectivity) */
  required: boolean;
}

/**
 * Spawn point for enemies/items.
 */
export interface SpawnPoint {
  x: number;
  y: number;
  type: 'enemy' | 'item' | 'chest' | 'hazard';
  /** Optional: specific entity ID to spawn */
  entityId?: string;
  /** Spawn weight (higher = more likely) */
  weight?: number;
}

/**
 * Room component data structure.
 * This is the format for room JSON files in assets/data/rooms/
 */
export interface RoomComponentData {
  /** Unique identifier */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Room type category */
  type: RoomType;
  
  /** Size in tiles */
  width: number;
  height: number;
  
  /** Size category for constraint matching */
  sizeCategory: 'small' | 'medium' | 'large';
  
  /** Available door slots */
  doorSlots: DoorSlot[];
  
  /** Tile data (2D array of TileType values) */
  tiles: number[][];
  
  /** Spawn points */
  spawns: SpawnPoint[];
  
  /** Difficulty rating (1-10) */
  difficulty: number;
  
  /** Minimum floor this room can appear on */
  minFloor?: number;
  
  /** Maximum floor this room can appear on */
  maxFloor?: number;
  
  /** Tags for filtering (e.g., "fire_theme", "water_hazards") */
  tags?: string[];
  
  /** Weight for random selection (higher = more common) */
  weight?: number;
}

/**
 * Constraint requirements for room selection.
 */
export interface RoomConstraints {
  /** Required door direction (must have door slot in this direction) */
  requiredDoor: DoorDirection;
  
  /** Allowed size categories */
  allowedSizes?: ('small' | 'medium' | 'large')[];
  
  /** Required room type */
  requiredType?: RoomType;
  
  /** Maximum difficulty */
  maxDifficulty?: number;
  
  /** Minimum difficulty */
  minDifficulty?: number;
  
  /** Current floor number */
  floorNumber?: number;
  
  /** Required tags (room must have ALL of these) */
  requiredTags?: string[];
  
  /** Excluded tags (room must have NONE of these) */
  excludedTags?: string[];
  
  /** IDs of rooms already used (to avoid repetition) */
  usedRoomIds?: string[];
}

/**
 * Get the opposite door direction.
 */
export function getOppositeDirection(dir: DoorDirection): DoorDirection {
  switch (dir) {
    case DoorDirection.NORTH: return DoorDirection.SOUTH;
    case DoorDirection.SOUTH: return DoorDirection.NORTH;
    case DoorDirection.EAST: return DoorDirection.WEST;
    case DoorDirection.WEST: return DoorDirection.EAST;
  }
}

/**
 * Check if a room component satisfies constraints.
 */
export function roomMatchesConstraints(
  room: RoomComponentData,
  constraints: RoomConstraints
): boolean {
  // Must have the required door slot
  const hasRequiredDoor = room.doorSlots.some(
    (slot) => slot.direction === constraints.requiredDoor
  );
  if (!hasRequiredDoor) return false;
  
  // Check size category
  if (constraints.allowedSizes && !constraints.allowedSizes.includes(room.sizeCategory)) {
    return false;
  }
  
  // Check room type
  if (constraints.requiredType && room.type !== constraints.requiredType) {
    return false;
  }
  
  // Check difficulty
  if (constraints.maxDifficulty !== undefined && room.difficulty > constraints.maxDifficulty) {
    return false;
  }
  if (constraints.minDifficulty !== undefined && room.difficulty < constraints.minDifficulty) {
    return false;
  }
  
  // Check floor requirements
  if (constraints.floorNumber !== undefined) {
    if (room.minFloor !== undefined && constraints.floorNumber < room.minFloor) {
      return false;
    }
    if (room.maxFloor !== undefined && constraints.floorNumber > room.maxFloor) {
      return false;
    }
  }
  
  // Check required tags
  if (constraints.requiredTags) {
    for (const tag of constraints.requiredTags) {
      if (!room.tags?.includes(tag)) return false;
    }
  }
  
  // Check excluded tags
  if (constraints.excludedTags && room.tags) {
    for (const tag of constraints.excludedTags) {
      if (room.tags.includes(tag)) return false;
    }
  }
  
  // Check if already used
  if (constraints.usedRoomIds?.includes(room.id)) {
    return false;
  }
  
  return true;
}
