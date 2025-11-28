/**
 * @file LiveDungeonManager.ts
 * @description Manages on-demand dungeon generation as player explores.
 * Generates rooms when doors are entered rather than pre-generating everything.
 */

import Phaser from 'phaser';
import { Room, RoomType, DoorDirection } from './Room';
import { RoomComponentData, getOppositeDirection, RoomConstraints } from './RoomComponent';
import { RoomComponentRegistry } from './RoomComponentRegistry';
import { SeededRandom } from '@utils/Random';
import { EventManager } from '@managers/EventManager';
import { EVENTS, TILE_SIZE } from '@config/Constants';

/**
 * Active door that leads to an ungenerated room.
 */
interface PendingDoor {
  roomId: string;
  direction: DoorDirection;
  worldX: number;
  worldY: number;
}

/**
 * Live Dungeon Manager - handles on-demand room generation.
 * 
 * How it works:
 * 1. Start room is generated when floor begins
 * 2. Doors in the start room lead to "pending" connections
 * 3. When player enters a door, a compatible room is selected and generated
 * 4. New room's doors become pending connections (or connect to existing rooms)
 * 5. Process repeats as player explores
 * 
 * @example
 * ```ts
 * const dungeon = new LiveDungeonManager(scene, { seed: 12345, floorNumber: 1 });
 * dungeon.initialize();
 * 
 * // When player hits door trigger
 * dungeon.enterDoor(currentRoom, DoorDirection.NORTH);
 * ```
 */
export class LiveDungeonManager {
  private scene: Phaser.Scene;
  private rng: SeededRandom;
  private events: EventManager;
  
  /** All generated rooms */
  private rooms: Map<string, Room> = new Map();
  
  /** Grid position to room mapping */
  private grid: Map<string, Room> = new Map();
  
  /** Doors that lead to ungenerated rooms */
  private pendingDoors: Map<string, PendingDoor> = new Map();
  
  /** Track which room component IDs have been used */
  private usedComponentIds: Set<string> = new Set();
  
  /** Current floor number */
  private floorNumber: number;
  
  /** Starting room */
  private startRoom: Room | null = null;
  
  /** Current room player is in */
  private currentRoom: Room | null = null;
  
  /** Max rooms to generate on this floor */
  private maxRooms: number;
  
  /** Rooms generated so far */
  private roomCount: number = 0;
  
  /** Whether boss room has been placed */
  private bossPlaced: boolean = false;
  
  constructor(
    scene: Phaser.Scene,
    config: {
      seed?: number;
      floorNumber: number;
      maxRooms?: number;
    }
  ) {
    this.scene = scene;
    this.rng = new SeededRandom(config.seed ?? Date.now());
    this.floorNumber = config.floorNumber;
    this.maxRooms = config.maxRooms ?? 10 + config.floorNumber * 2;
    this.events = EventManager.getInstance();
  }
  
  /**
   * Initialize the dungeon with the starting room.
   */
  public initialize(): Room {
    // Find a start room component
    const startComponent = RoomComponentRegistry.findMatching(
      {
        requiredDoor: DoorDirection.NORTH, // Start room should have at least one exit
        requiredType: RoomType.START,
      },
      this.rng
    );
    
    if (!startComponent) {
      throw new Error('No valid start room component found');
    }
    
    // Create the start room at origin
    this.startRoom = this.createRoomFromComponent(startComponent, 0, 0);
    this.currentRoom = this.startRoom;
    this.roomCount = 1;
    
    // Register pending doors from start room
    this.registerPendingDoors(this.startRoom);
    
    return this.startRoom;
  }
  
  /**
   * Create a Room from a RoomComponentData at a grid position.
   */
  private createRoomFromComponent(
    component: RoomComponentData,
    gridX: number,
    gridY: number
  ): Room {
    const room = new Room({
      id: `room_${this.rooms.size}_${component.id}`,
      type: component.type,
      width: component.width,
      height: component.height,
      templateId: component.id,
    });
    
    room.setGridPosition(gridX, gridY);
    room.setTiles(component.tiles);
    
    // Add doors for each slot
    for (const slot of component.doorSlots) {
      room.addDoor(slot.direction, null); // Target unknown until connected
    }
    
    // Store room
    this.rooms.set(room.id, room);
    this.grid.set(this.gridKey(gridX, gridY), room);
    this.usedComponentIds.add(component.id);
    
    return room;
  }
  
  /**
   * Register doors that lead to ungenerated rooms.
   */
  private registerPendingDoors(room: Room): void {
    for (const door of room.getDoors()) {
      // Check if there's already a room in that direction
      const targetPos = this.getAdjacentPosition(room.gridX, room.gridY, door.direction);
      const existingRoom = this.grid.get(this.gridKey(targetPos.x, targetPos.y));
      
      if (existingRoom) {
        // Connect to existing room
        this.connectRooms(room, existingRoom, door.direction);
      } else {
        // Register as pending
        const pendingKey = `${room.id}_${door.direction}`;
        this.pendingDoors.set(pendingKey, {
          roomId: room.id,
          direction: door.direction,
          worldX: door.position.x * TILE_SIZE + room.worldX,
          worldY: door.position.y * TILE_SIZE + room.worldY,
        });
      }
    }
  }
  
  /**
   * Enter a door and generate/connect to the next room.
   */
  public enterDoor(fromRoom: Room, direction: DoorDirection): Room | null {
    const pendingKey = `${fromRoom.id}_${direction}`;
    const pending = this.pendingDoors.get(pendingKey);
    
    if (!pending) {
      // Check if there's already a room there
      const targetPos = this.getAdjacentPosition(fromRoom.gridX, fromRoom.gridY, direction);
      const existingRoom = this.grid.get(this.gridKey(targetPos.x, targetPos.y));
      
      if (existingRoom) {
        this.setCurrentRoom(existingRoom);
        return existingRoom;
      }
      
      console.warn('No pending door found:', pendingKey);
      return null;
    }
    
    // Generate new room
    const newRoom = this.generateRoomForDoor(fromRoom, direction);
    
    if (!newRoom) {
      console.warn('Failed to generate room for door');
      return null;
    }
    
    // Remove from pending
    this.pendingDoors.delete(pendingKey);
    
    // Connect rooms
    this.connectRooms(fromRoom, newRoom, direction);
    
    // Register new room's pending doors
    this.registerPendingDoors(newRoom);
    
    // Set as current room
    this.setCurrentRoom(newRoom);
    
    // Emit event
    this.events.emit(EVENTS.ROOM_ENTERED, { room: newRoom, from: fromRoom });
    
    return newRoom;
  }
  
  /**
   * Generate a new room for a door.
   */
  private generateRoomForDoor(fromRoom: Room, direction: DoorDirection): Room | null {
    // Determine room type
    let roomType = RoomType.NORMAL;
    
    // Check if we should place boss room
    if (!this.bossPlaced && this.roomCount >= this.maxRooms - 1) {
      roomType = RoomType.BOSS;
      this.bossPlaced = true;
    }
    // Occasionally place special rooms
    else if (this.rng.chance(0.15) && this.roomCount > 2) {
      roomType = this.rng.pick([RoomType.TREASURE, RoomType.SHOP]);
    }
    
    // Build constraints
    const constraints: RoomConstraints = {
      requiredDoor: getOppositeDirection(direction),
      requiredType: roomType,
      floorNumber: this.floorNumber,
      minDifficulty: Math.max(1, this.floorNumber - 1),
      maxDifficulty: this.floorNumber + 2,
      usedRoomIds: Array.from(this.usedComponentIds),
    };
    
    // If we've used many rooms, allow repeats
    if (this.usedComponentIds.size > 10) {
      constraints.usedRoomIds = undefined;
    }
    
    // Find matching component
    const component = RoomComponentRegistry.findMatching(constraints, this.rng);
    
    if (!component) {
      // Fallback: try without type constraint
      constraints.requiredType = undefined;
      const fallback = RoomComponentRegistry.findMatching(constraints, this.rng);
      if (!fallback) return null;
      return this.createRoomAtDoor(fallback, fromRoom, direction);
    }
    
    return this.createRoomAtDoor(component, fromRoom, direction);
  }
  
  /**
   * Create a room at the position of a door.
   */
  private createRoomAtDoor(
    component: RoomComponentData,
    fromRoom: Room,
    direction: DoorDirection
  ): Room {
    const targetPos = this.getAdjacentPosition(fromRoom.gridX, fromRoom.gridY, direction);
    const room = this.createRoomFromComponent(component, targetPos.x, targetPos.y);
    this.roomCount++;
    return room;
  }
  
  /**
   * Connect two rooms via doors.
   */
  private connectRooms(roomA: Room, roomB: Room, directionFromA: DoorDirection): void {
    const doorA = roomA.getDoor(directionFromA);
    const doorB = roomB.getDoor(getOppositeDirection(directionFromA));
    
    if (doorA) {
      doorA.targetRoomId = roomB.id;
    }
    if (doorB) {
      doorB.targetRoomId = roomA.id;
    }
  }
  
  /**
   * Get adjacent grid position in a direction.
   */
  private getAdjacentPosition(
    x: number,
    y: number,
    direction: DoorDirection
  ): { x: number; y: number } {
    switch (direction) {
      case DoorDirection.NORTH: return { x, y: y - 1 };
      case DoorDirection.SOUTH: return { x, y: y + 1 };
      case DoorDirection.EAST: return { x: x + 1, y };
      case DoorDirection.WEST: return { x: x - 1, y };
    }
  }
  
  /**
   * Create grid key from coordinates.
   */
  private gridKey(x: number, y: number): string {
    return `${x},${y}`;
  }
  
  /**
   * Set the current room and handle room transition.
   */
  private setCurrentRoom(room: Room): void {
    const previousRoom = this.currentRoom;
    this.currentRoom = room;
    room.visit();
    
    // Lock doors if room has enemies
    if (room.type === RoomType.NORMAL && !room.cleared) {
      room.lockDoors();
    }
  }
  
  /**
   * Mark current room as cleared.
   */
  public clearCurrentRoom(): void {
    if (this.currentRoom) {
      this.currentRoom.clear();
      this.events.emit(EVENTS.ROOM_CLEARED, { room: this.currentRoom });
    }
  }
  
  /**
   * Get current room.
   */
  public getCurrentRoom(): Room | null {
    return this.currentRoom;
  }
  
  /**
   * Get start room.
   */
  public getStartRoom(): Room | null {
    return this.startRoom;
  }
  
  /**
   * Get all generated rooms.
   */
  public getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }
  
  /**
   * Get room by ID.
   */
  public getRoom(id: string): Room | undefined {
    return this.rooms.get(id);
  }
  
  /**
   * Get room at grid position.
   */
  public getRoomAt(gridX: number, gridY: number): Room | undefined {
    return this.grid.get(this.gridKey(gridX, gridY));
  }
  
  /**
   * Check if all rooms have been explored.
   */
  public isFullyExplored(): boolean {
    return this.pendingDoors.size === 0;
  }
  
  /**
   * Check if boss has been placed.
   */
  public hasBoss(): boolean {
    return this.bossPlaced;
  }
  
  /**
   * Get room count.
   */
  public getRoomCount(): number {
    return this.roomCount;
  }
  
  /**
   * Get pending door count.
   */
  public getPendingDoorCount(): number {
    return this.pendingDoors.size;
  }
}
