/**
 * Zone Manager - handles zone-specific room generation and tilesets
 * Manages different dungeon zones with unique themes and room pools
 */

// Room template interface for type safety
interface RoomTemplate {
  id: string;
  name: string;
  type: string;
  zone?: string;
  width: number;
  height: number;
  tiles: number[][];
  weight?: number;
}

export interface Zone {
  id: string;
  name: string;
  description: string;
  tilesetKey: string;
  roomTypes: string[]; // Room type IDs that can spawn in this zone
  minFloor: number;
  maxFloor: number;
  ambientColor: string;
  fogColor: string;
}

export class ZoneManager {
  private zones: Map<string, Zone> = new Map();
  private currentZone: Zone | null = null;
  private currentFloor: number = 0;

  constructor() {
    this.initializeZones();
  }

  /**
   * Initialize all available zones
   */
  private initializeZones(): void {
    // Catacombs Zone - dark, tomb-like
    this.zones.set('catacombs', {
      id: 'catacombs',
      name: 'The Catacombs',
      description: 'Ancient burial chambers filled with undead',
      tilesetKey: 'catacombs-tileset',
      roomTypes: ['normal', 'treasure', 'shop'],
      minFloor: 1,
      maxFloor: 3,
      ambientColor: '#1a1a2e',
      fogColor: '#0f0f1e'
    });

    // Forgotten Library Zone - mystical, book-filled
    this.zones.set('library', {
      id: 'library',
      name: 'The Forgotten Library',
      description: 'Halls of forgotten knowledge and arcane secrets',
      tilesetKey: 'library-tileset',
      roomTypes: ['normal', 'treasure', 'shop'],
      minFloor: 2,
      maxFloor: 5,
      ambientColor: '#16213e',
      fogColor: '#0f1629'
    });

    // Crystal Caves Zone - glowing, magical
    this.zones.set('crystal_caves', {
      id: 'crystal_caves',
      name: 'The Crystal Caves',
      description: 'Luminous caves pulsing with magical energy',
      tilesetKey: 'crystal_caves-tileset',
      roomTypes: ['normal', 'treasure', 'boss'],
      minFloor: 3,
      maxFloor: 6,
      ambientColor: '#0f3460',
      fogColor: '#0a2847'
    });

    // Forge Depths Zone - industrial, fiery
    this.zones.set('forge_depths', {
      id: 'forge_depths',
      name: 'The Forge Depths',
      description: 'Molten chambers where ancient weapons were forged',
      tilesetKey: 'forge_depths-tileset',
      roomTypes: ['normal', 'treasure', 'boss'],
      minFloor: 4,
      maxFloor: 8,
      ambientColor: '#2d1b69',
      fogColor: '#1f0f47'
    });
  }

  /**
   * Get zone for current floor
   */
  public getZoneForFloor(floor: number): Zone {
    // Find zones that can spawn on this floor
    const eligibleZones = Array.from(this.zones.values()).filter(
      zone => floor >= zone.minFloor && floor <= zone.maxFloor
    );

    if (eligibleZones.length === 0) {
      // Fallback to catacombs
      return this.zones.get('catacombs')!;
    }

    // Random weighted selection (can add weights later)
    return eligibleZones[Math.floor(Math.random() * eligibleZones.length)];
  }

  /**
   * Set current zone and floor
   */
  public setCurrentZone(floor: number): void {
    this.currentFloor = floor;
    this.currentZone = this.getZoneForFloor(floor);
  }

  /**
   * Get current zone
   */
  public getCurrentZone(): Zone | null {
    return this.currentZone;
  }

  /**
   * Filter rooms by current zone
   */
  public filterRoomsForZone(rooms: RoomTemplate[]): RoomTemplate[] {
    if (!this.currentZone) return rooms;

    return rooms.filter(room => {
      // Hub and start rooms can always appear
      if (room.type === 'hub' || room.type === 'start') return true;
      
      // Check if room type is allowed in current zone
      return this.currentZone!.roomTypes.includes(room.type);
    });
  }

  /**
   * Get random room for current zone matching size constraints
   */
  public getRandomRoom(rooms: RoomTemplate[], width?: number, height?: number): RoomTemplate {
    const zoneRooms = this.filterRoomsForZone(rooms);
    
    // Filter by size if specified
    let candidateRooms = zoneRooms;
    if (width && height) {
      candidateRooms = zoneRooms.filter(room => 
        room.width === width && room.height === height
      );
    }

    // If no exact size match, get closest size
    if (candidateRooms.length === 0 && width && height) {
      candidateRooms = zoneRooms.filter(room => 
        room.width <= width && room.height <= height
      );
    }

    // Fallback to any zone room
    if (candidateRooms.length === 0) {
      candidateRooms = zoneRooms;
    }

    // Weighted random selection based on room weight
    const totalWeight = candidateRooms.reduce((sum, room) => sum + (room.weight || 1), 0);
    let random = Math.random() * totalWeight;
    
    for (const room of candidateRooms) {
      random -= (room.weight || 1);
      if (random <= 0) {
        return room;
      }
    }

    return candidateRooms[0];
  }

  /**
   * Get all zones (for UI/debug)
   */
  public getAllZones(): Zone[] {
    return Array.from(this.zones.values());
  }
}
