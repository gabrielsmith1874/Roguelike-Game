/**
 * @file Room.ts
 * @description Room class for dungeon generation.
 */

import Phaser from 'phaser';
import { TILE_SIZE } from '@config/Constants';

/**
 * Room types for different gameplay encounters.
 */
export enum RoomType {
  /** Starting room - safe, no enemies */
  START = 'start',
  /** Normal combat room */
  NORMAL = 'normal',
  /** Treasure/reward room */
  TREASURE = 'treasure',
  /** Shop room */
  SHOP = 'shop',
  /** Boss room */
  BOSS = 'boss',
  /** Secret room (hidden) */
  SECRET = 'secret',
  /** Challenge room (harder enemies, better rewards) */
  CHALLENGE = 'challenge',
  /** Hub room - safe zone with services (fountain, shop) */
  HUB = 'hub',
}

/**
 * Door directions.
 */
export enum DoorDirection {
  NORTH = 'north',
  SOUTH = 'south',
  EAST = 'east',
  WEST = 'west',
}

/**
 * Door connection data.
 */
export interface Door {
  direction: DoorDirection;
  targetRoomId: string | null;
  isLocked: boolean;
  isOpen: boolean;
  position: { x: number; y: number };
}

/**
 * Room configuration.
 */
export interface RoomConfig {
  id: string;
  type: RoomType;
  width: number; // in tiles
  height: number; // in tiles
  templateId?: string;
}

/**
 * Room class - represents a single room in the dungeon.
 */
export class Room {
  public readonly id: string;
  public readonly type: RoomType;
  public readonly width: number;
  public readonly height: number;
  
  /** Position in the dungeon grid */
  public gridX: number = 0;
  public gridY: number = 0;
  
  /** World position (pixels) */
  public worldX: number = 0;
  public worldY: number = 0;
  
  /** Doors connecting to other rooms */
  private doors: Map<DoorDirection, Door> = new Map();
  
  /** Whether room has been visited */
  public visited: boolean = false;
  
  /** Whether room is cleared of enemies */
  public cleared: boolean = false;
  
  /** Template ID for room layout */
  public templateId?: string;
  
  /** Tile data for the room */
  private tiles: number[][] = [];
  
  constructor(config: RoomConfig) {
    this.id = config.id;
    this.type = config.type;
    this.width = config.width;
    this.height = config.height;
    this.templateId = config.templateId;
    
    this.initializeTiles();
  }
  
  /**
   * Initialize empty tile grid.
   */
  private initializeTiles(): void {
    this.tiles = Array.from({ length: this.height }, () =>
      Array.from({ length: this.width }, () => 0)
    );
  }
  
  /**
   * Set grid position.
   */
  public setGridPosition(x: number, y: number): void {
    this.gridX = x;
    this.gridY = y;
    this.worldX = x * this.width * TILE_SIZE;
    this.worldY = y * this.height * TILE_SIZE;
  }
  
  /**
   * Add a door to this room.
   */
  public addDoor(direction: DoorDirection, targetRoomId: string | null = null): void {
    const position = this.getDoorPosition(direction);
    
    this.doors.set(direction, {
      direction,
      targetRoomId,
      isLocked: false,
      isOpen: true,
      position,
    });
  }
  
  /**
   * Get door position based on direction.
   */
  private getDoorPosition(direction: DoorDirection): { x: number; y: number } {
    const centerX = Math.floor(this.width / 2);
    const centerY = Math.floor(this.height / 2);
    
    switch (direction) {
      case DoorDirection.NORTH:
        return { x: centerX, y: 0 };
      case DoorDirection.SOUTH:
        return { x: centerX, y: this.height - 1 };
      case DoorDirection.EAST:
        return { x: this.width - 1, y: centerY };
      case DoorDirection.WEST:
        return { x: 0, y: centerY };
    }
  }
  
  /**
   * Get a door by direction.
   */
  public getDoor(direction: DoorDirection): Door | undefined {
    return this.doors.get(direction);
  }
  
  /**
   * Get all doors.
   */
  public getDoors(): Door[] {
    return Array.from(this.doors.values());
  }
  
  /**
   * Check if room has a door in direction.
   */
  public hasDoor(direction: DoorDirection): boolean {
    return this.doors.has(direction);
  }
  
  /**
   * Lock all doors.
   */
  public lockDoors(): void {
    for (const door of this.doors.values()) {
      door.isLocked = true;
      door.isOpen = false;
    }
  }
  
  /**
   * Unlock all doors.
   */
  public unlockDoors(): void {
    for (const door of this.doors.values()) {
      door.isLocked = false;
      door.isOpen = true;
    }
  }
  
  /**
   * Get room center in world coordinates.
   */
  public getCenter(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(
      this.worldX + (this.width * TILE_SIZE) / 2,
      this.worldY + (this.height * TILE_SIZE) / 2
    );
  }
  
  /**
   * Get room bounds in world coordinates.
   */
  public getBounds(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(
      this.worldX,
      this.worldY,
      this.width * TILE_SIZE,
      this.height * TILE_SIZE
    );
  }
  
  /**
   * Get a tile value.
   */
  public getTile(x: number, y: number): number {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return -1;
    }
    return this.tiles[y][x];
  }
  
  /**
   * Set a tile value.
   */
  public setTile(x: number, y: number, value: number): void {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.tiles[y][x] = value;
    }
  }
  
  /**
   * Get all tiles.
   */
  public getTiles(): number[][] {
    return this.tiles;
  }
  
  /**
   * Set all tiles from a template.
   */
  public setTiles(tiles: number[][]): void {
    this.tiles = tiles;
  }
  
  /**
   * Mark room as visited.
   */
  public visit(): void {
    this.visited = true;
  }
  
  /**
   * Mark room as cleared.
   */
  public clear(): void {
    this.cleared = true;
    this.unlockDoors();
  }
}
