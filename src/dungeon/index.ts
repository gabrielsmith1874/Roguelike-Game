/**
 * @file index.ts
 * @description Dungeon system exports.
 */

export { Room, RoomType, DoorDirection } from './Room';
export type { Door, RoomConfig } from './Room';

export { DungeonGenerator } from './DungeonGenerator';
export type { DungeonConfig, DungeonFloor } from './DungeonGenerator';

export { RoomTemplates, TileType } from './RoomTemplates';
export type { RoomTemplate } from './RoomTemplates';

// On-demand room component system
export { 
  getOppositeDirection,
  roomMatchesConstraints,
} from './RoomComponent';
export type { 
  RoomComponentData, 
  RoomConstraints, 
  DoorSlot, 
  SpawnPoint 
} from './RoomComponent';

export { RoomComponentRegistry } from './RoomComponentRegistry';
export { LiveDungeonManager } from './LiveDungeonManager';
