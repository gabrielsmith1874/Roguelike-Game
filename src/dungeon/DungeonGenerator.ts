/**
 * @file DungeonGenerator.ts
 * @description Procedural dungeon generation.
 */

import { Room, RoomType, DoorDirection, RoomConfig } from './Room';
import { 
  MIN_ROOMS_PER_FLOOR, 
  MAX_ROOMS_PER_FLOOR,
  MIN_ROOM_WIDTH,
  MAX_ROOM_WIDTH,
  MIN_ROOM_HEIGHT,
  MAX_ROOM_HEIGHT,
} from '@config/Constants';
import { SeededRandom } from '@utils/Random';

/**
 * Dungeon configuration.
 */
export interface DungeonConfig {
  seed?: number;
  floorNumber: number;
  minRooms?: number;
  maxRooms?: number;
  difficulty?: number;
}

/**
 * Generated dungeon floor.
 */
export interface DungeonFloor {
  rooms: Room[];
  startRoom: Room;
  bossRoom: Room;
  seed: number;
  floorNumber: number;
}

/**
 * Dungeon Generator - creates procedural dungeon layouts.
 * 
 * Algorithm:
 * 1. Place start room at center
 * 2. Use random walk / branching to place connected rooms
 * 3. Place boss room at furthest point from start
 * 4. Place special rooms (treasure, shop) along the way
 * 5. Validate connectivity
 * 
 * @example
 * ```ts
 * const generator = new DungeonGenerator();
 * const floor = generator.generate({ floorNumber: 1, seed: 12345 });
 * ```
 */
export class DungeonGenerator {
  private rng!: SeededRandom;
  private rooms: Map<string, Room> = new Map();
  private grid: Map<string, Room> = new Map();
  
  /**
   * Generate a dungeon floor.
   */
  public generate(config: DungeonConfig): DungeonFloor {
    // Initialize RNG
    const seed = config.seed ?? Date.now();
    this.rng = new SeededRandom(seed);
    
    // Reset state
    this.rooms.clear();
    this.grid.clear();
    
    // Configuration
    const minRooms = config.minRooms ?? MIN_ROOMS_PER_FLOOR;
    const maxRooms = config.maxRooms ?? MAX_ROOMS_PER_FLOOR;
    const targetRooms = this.rng.intBetween(minRooms, maxRooms);
    
    // Generate rooms
    const startRoom = this.createStartRoom();
    this.generateMainPath(startRoom, targetRooms);
    
    // Find and create boss room at furthest point
    const bossRoom = this.placeBossRoom(startRoom);
    
    // Place special rooms
    this.placeSpecialRooms(config.floorNumber);
    
    // Connect doors between adjacent rooms
    this.connectRooms();
    
    return {
      rooms: Array.from(this.rooms.values()),
      startRoom,
      bossRoom,
      seed,
      floorNumber: config.floorNumber,
    };
  }
  
  /**
   * Create the starting room.
   */
  private createStartRoom(): Room {
    const room = this.createRoom(RoomType.START, 0, 0);
    return room;
  }
  
  /**
   * Create a room at grid position.
   */
  private createRoom(type: RoomType, gridX: number, gridY: number): Room {
    const id = `room_${this.rooms.size}`;
    const width = this.rng.intBetween(MIN_ROOM_WIDTH, MAX_ROOM_WIDTH);
    const height = this.rng.intBetween(MIN_ROOM_HEIGHT, MAX_ROOM_HEIGHT);
    
    const config: RoomConfig = {
      id,
      type,
      width,
      height,
    };
    
    const room = new Room(config);
    room.setGridPosition(gridX, gridY);
    
    this.rooms.set(id, room);
    this.grid.set(this.gridKey(gridX, gridY), room);
    
    return room;
  }
  
  /**
   * Generate the main path of rooms.
   */
  private generateMainPath(startRoom: Room, targetRooms: number): void {
    const frontier: Array<{ x: number; y: number }> = [];
    
    // Add neighbors of start room to frontier
    this.addNeighborsToFrontier(startRoom.gridX, startRoom.gridY, frontier);
    
    while (this.rooms.size < targetRooms && frontier.length > 0) {
      // Pick random frontier position
      const index = this.rng.intBetween(0, frontier.length - 1);
      const pos = frontier.splice(index, 1)[0];
      
      // Skip if already occupied
      if (this.grid.has(this.gridKey(pos.x, pos.y))) {
        continue;
      }
      
      // Create room
      const room = this.createRoom(RoomType.NORMAL, pos.x, pos.y);
      
      // Add new frontier positions
      this.addNeighborsToFrontier(room.gridX, room.gridY, frontier);
    }
  }
  
  /**
   * Add unoccupied neighbors to frontier.
   */
  private addNeighborsToFrontier(
    x: number, 
    y: number, 
    frontier: Array<{ x: number; y: number }>
  ): void {
    const neighbors = [
      { x: x, y: y - 1 }, // North
      { x: x, y: y + 1 }, // South
      { x: x + 1, y: y }, // East
      { x: x - 1, y: y }, // West
    ];
    
    for (const neighbor of neighbors) {
      const key = this.gridKey(neighbor.x, neighbor.y);
      if (!this.grid.has(key)) {
        frontier.push(neighbor);
      }
    }
  }
  
  /**
   * Place boss room at furthest point from start.
   */
  private placeBossRoom(startRoom: Room): Room {
    // Find room furthest from start
    let furthestRoom: Room = startRoom;
    let maxDistance = 0;
    
    for (const room of this.rooms.values()) {
      const distance = Math.abs(room.gridX - startRoom.gridX) + 
                       Math.abs(room.gridY - startRoom.gridY);
      if (distance > maxDistance) {
        maxDistance = distance;
        furthestRoom = room;
      }
    }
    
    // Find an empty spot adjacent to furthest room for boss
    const directions = [
      { dx: 0, dy: -1, dir: DoorDirection.NORTH },
      { dx: 0, dy: 1, dir: DoorDirection.SOUTH },
      { dx: 1, dy: 0, dir: DoorDirection.EAST },
      { dx: -1, dy: 0, dir: DoorDirection.WEST },
    ];
    
    for (const { dx, dy } of this.rng.shuffle(directions)) {
      const bossX = furthestRoom.gridX + dx;
      const bossY = furthestRoom.gridY + dy;
      const key = this.gridKey(bossX, bossY);
      
      if (!this.grid.has(key)) {
        return this.createRoom(RoomType.BOSS, bossX, bossY);
      }
    }
    
    // If no empty spot, convert furthest room to boss
    // (This shouldn't happen with proper generation)
    furthestRoom.type === RoomType.BOSS;
    return furthestRoom;
  }
  
  /**
   * Place special rooms (treasure, shop).
   */
  private placeSpecialRooms(floorNumber: number): void {
    const normalRooms = Array.from(this.rooms.values())
      .filter((r) => r.type === RoomType.NORMAL);
    
    if (normalRooms.length < 2) return;
    
    // Shuffle and pick rooms for special types
    const shuffled = this.rng.shuffle(normalRooms);
    
    // Always one treasure room
    if (shuffled.length > 0) {
      // Can't directly reassign type, would need to recreate room
      // For template purposes, we'll note this is where you'd set special room
      // TODO: Implement room type change or create special rooms during generation
    }
    
    // Shop room every other floor
    if (floorNumber % 2 === 0 && shuffled.length > 1) {
      // TODO: Set as shop room
    }
  }
  
  /**
   * Connect adjacent rooms with doors.
   */
  private connectRooms(): void {
    for (const room of this.rooms.values()) {
      const neighbors = this.getNeighbors(room.gridX, room.gridY);
      
      for (const { room: neighbor, direction } of neighbors) {
        if (!room.hasDoor(direction)) {
          room.addDoor(direction, neighbor.id);
        }
      }
    }
  }
  
  /**
   * Get neighboring rooms.
   */
  private getNeighbors(x: number, y: number): Array<{ room: Room; direction: DoorDirection }> {
    const result: Array<{ room: Room; direction: DoorDirection }> = [];
    
    const checks = [
      { dx: 0, dy: -1, dir: DoorDirection.NORTH },
      { dx: 0, dy: 1, dir: DoorDirection.SOUTH },
      { dx: 1, dy: 0, dir: DoorDirection.EAST },
      { dx: -1, dy: 0, dir: DoorDirection.WEST },
    ];
    
    for (const { dx, dy, dir } of checks) {
      const key = this.gridKey(x + dx, y + dy);
      const room = this.grid.get(key);
      if (room) {
        result.push({ room, direction: dir });
      }
    }
    
    return result;
  }
  
  /**
   * Create grid key from coordinates.
   */
  private gridKey(x: number, y: number): string {
    return `${x},${y}`;
  }
}
