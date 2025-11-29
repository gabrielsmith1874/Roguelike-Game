/**
 * @file GameScene.ts
 * @description Main gameplay scene where the action happens.
 */

import { BaseScene } from './BaseScene';
import { SCENES, EVENTS, TILE_SIZE, DEPTH, GAME_WIDTH, GAME_HEIGHT } from '@config/Constants';
import { Player } from '@entities/Player';
import { ZoneManager } from '../managers/ZoneManager';
import { DungeonGenerator, DungeonFloor } from '../dungeon/DungeonGenerator';
import { Room, DoorDirection } from '../dungeon/Room';

/**
 * Game start data passed from MenuScene.
 */
interface GameStartData {
  continueRun: boolean;
  character: string;
  dungeon: string;
}

/**
 * Room template from JSON.
 */
interface RoomTemplate {
  id: string;
  name: string;
  type: string;
  zone?: string;
  width: number;
  height: number;
  tiles: number[][];
  spawns?: Array<{ x: number; y: number; type: string; entityId?: string }>;
  weight?: number;
}

/**
 * Main game scene - handles core gameplay loop.
 * 
 * Responsibilities:
 * - Dungeon generation and rendering
 * - Entity management (player, enemies, projectiles)
 * - Input handling
 * - Game state (pausing, room transitions)
 */
export class GameScene extends BaseScene {
  // Start data from menu
  private startData!: GameStartData;
  
  // Entity references
  private player!: Player;
  
  // Room rendering
  private roomContainer!: Phaser.GameObjects.Container;
  private currentRoom!: RoomTemplate;
  
  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  
  // Zone management
  private zoneManager!: ZoneManager;
  private currentFloor!: number;
  private isTransitioning!: boolean;
  private doorPositions: Array<{x: number, y: number, direction: DoorDirection}> = [];
  private torchPositions: Array<{x: number, y: number}> = [];
  
  // Dungeon map (pre-generated)
  private dungeonGenerator!: DungeonGenerator;
  private dungeonFloor!: DungeonFloor;
  private currentDungeonRoom!: Room;
  private visitedRooms: Set<string> = new Set();
  
  // Wall collision bodies (stored for adding collision after player setup)
  private wallBodies: Phaser.GameObjects.Rectangle[] = [];
  
  // Track used templates for variety
  private usedTemplateIds: Set<string> = new Set();
  private roomTemplateAssignments: Map<string, string> = new Map(); // dungeonRoomId -> templateId
  
  constructor() {
    super(SCENES.GAME);
  }
  
  init(data: GameStartData): void {
    this.startData = data || { continueRun: false, character: 'wizard', dungeon: 'depths' };
  }
  
  create(): void {
    super.create();
    
    // Initialize zone manager
    this.zoneManager = new ZoneManager();
    this.currentFloor = 1; // Start at floor 1
    this.isTransitioning = false;
    
    // Set initial zone
    this.zoneManager.setCurrentZone(this.currentFloor);
    
    // Disable physics debug rendering
    this.physics.world.drawDebug = false;
    if (this.physics.world.debugGraphic) {
      this.physics.world.debugGraphic.clear();
    }
    
    // Generate fresh dungeon each time
    this.dungeonGenerator = new DungeonGenerator();
    this.visitedRooms.clear();
    this.generateDungeonFloor();
    
    // Fade in
    this.cameras.main.fadeIn(500, 0, 0, 0);
    
    this.setupInput();
    this.setupWorld();
    
    // Render all rooms at once
    this.renderAllRooms();
    
    // Setup player at start position
    this.setupPlayer();
    
    // Position player at start room
    if (this.player) {
      this.player.setPosition(this.playerStartX, this.playerStartY);
    }
    
    // Setup wall collision now that player exists
    this.setupWallCollision();
    
    this.setupUI();
    this.setupEventListeners();
    
    // Camera follows player
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
  }
  
  update(time: number, delta: number): void {
    super.update(time, delta);
    
    this.handleInput();
    this.updateEntities(delta);
    this.updateSystems(delta);
  }
  
  /**
   * Set up keyboard and mouse input.
   */
  private setupInput(): void {
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      
      // WASD keys
      this.wasd = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
      
      // Pause on ESC
      this.input.keyboard.on('keydown-ESC', () => {
        this.pauseGame();
      });
    }
  }
  
  /**
   * Set up the game world (physics, camera, etc).
   */
  private setupWorld(): void {
    // Set background color based on current zone
    const zone = this.zoneManager.getCurrentZone();
    this.cameras.main.setBackgroundColor(zone?.ambientColor || '#1a1a2e');
    
    // Reset camera scroll
    this.cameras.main.setScroll(0, 0);
  }
  
  /**
   * Generate the dungeon floor map.
   */
  private generateDungeonFloor(): void {
    // Clear template tracking for new dungeon
    this.usedTemplateIds.clear();
    this.roomTemplateAssignments.clear();
    this.wallBodies = [];
    
    // Generate truly random seed using crypto API for better randomness
    const randomArray = new Uint32Array(1);
    crypto.getRandomValues(randomArray);
    const seed = randomArray[0];
    console.log('Dungeon seed:', seed);
    
    this.dungeonFloor = this.dungeonGenerator.generate({
      floorNumber: this.currentFloor,
      seed,
      minRooms: 6,
      maxRooms: 10
    });
    
    console.log('=== DUNGEON GENERATION ===');
    console.log('Rooms:', this.dungeonFloor.rooms.length);
    console.log('Layout:');
    
    // Visual map of dungeon layout
    const minX = Math.min(...this.dungeonFloor.rooms.map(r => r.gridX));
    const maxX = Math.max(...this.dungeonFloor.rooms.map(r => r.gridX));
    const minY = Math.min(...this.dungeonFloor.rooms.map(r => r.gridY));
    const maxY = Math.max(...this.dungeonFloor.rooms.map(r => r.gridY));
    
    for (let y = minY; y <= maxY; y++) {
      let row = '';
      for (let x = minX; x <= maxX; x++) {
        const room = this.dungeonFloor.rooms.find(r => r.gridX === x && r.gridY === y);
        if (room) {
          row += room.type === 'start' ? 'S' : room.type === 'boss' ? 'B' : 'R';
        } else {
          row += '.';
        }
      }
      console.log(row);
    }
    
    // Set current room to start room
    this.currentDungeonRoom = this.dungeonFloor.startRoom;
    this.visitedRooms.add(this.currentDungeonRoom.id);
  }

  /**
   * Render all dungeon rooms at once.
   */
  private renderAllRooms(): void {
    const roomsData = this.cache.json.get('rooms');
    if (!roomsData?.rooms) return;
    
    // Use standard room dimensions for consistent layout
    const standardRoomWidth = 11;
    const standardRoomHeight = 9;
    const standardPixelWidth = standardRoomWidth * TILE_SIZE;
    const standardPixelHeight = standardRoomHeight * TILE_SIZE;
    
    // Store room templates and calculate positions
    const roomTemplates = new Map<string, RoomTemplate>();
    const roomPositions = new Map<string, {x: number, y: number, width: number, height: number}>();
    
    // Get templates for all rooms and calculate layout
    for (const dungeonRoom of this.dungeonFloor.rooms) {
      const template = this.getRoomTemplateForDungeonRoom(dungeonRoom, roomsData.rooms);
      // Create standard room with proper walls and doorways
      const doors = dungeonRoom.getDoors();
      const standardRoom = this.createStandardRoom(template, standardRoomWidth, standardRoomHeight, doors);
      roomTemplates.set(dungeonRoom.id, standardRoom);
      
      // Use standard dimensions for grid positioning
      roomPositions.set(dungeonRoom.id, {
        x: dungeonRoom.gridX * standardPixelWidth,
        y: dungeonRoom.gridY * standardPixelHeight,
        width: standardPixelWidth,
        height: standardPixelHeight
      });
    }
    
    // Find dungeon bounds based on standard grid
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const pos of roomPositions.values()) {
      minX = Math.min(minX, pos.x);
      maxX = Math.max(maxX, pos.x + pos.width);
      minY = Math.min(minY, pos.y);
      maxY = Math.max(maxY, pos.y + pos.height);
    }
    
    // Calculate total dungeon size
    const dungeonWidth = maxX - minX;
    const dungeonHeight = maxY - minY;
    
    // Center offset to center the entire dungeon
    const centerOffsetX = (GAME_WIDTH - dungeonWidth) / 2 - minX;
    const centerOffsetY = (GAME_HEIGHT - dungeonHeight) / 2 - minY;
    
    // Render each room with standard spacing
    for (const dungeonRoom of this.dungeonFloor.rooms) {
      const template = roomTemplates.get(dungeonRoom.id)!;
      const pos = roomPositions.get(dungeonRoom.id)!;
      
      // Calculate room position on standard grid
      const roomX = pos.x + centerOffsetX;
      const roomY = pos.y + centerOffsetY;
      
      // Create container for this room
      const roomContainer = this.add.container(roomX, roomY);
      
      // Render tiles with collision (pass container position for world coordinates)
      this.renderRoomIntoContainer(template, roomContainer, roomX, roomY);
      
      // Draw door outlines for connected doors (positioned at standard grid edges)
      const doors = dungeonRoom.getDoors();
      for (const door of doors) {
        if (door.targetRoomId) {
          this.drawDoorOutlineInStandardSpace(door.direction, roomContainer, standardPixelWidth, standardPixelHeight);
        }
      }
      
      console.log(`Room ${dungeonRoom.id} padded to: ${template.width}x${template.height} (standard ${standardRoomWidth}x${standardRoomHeight})`);
    }
    
    // Set world bounds to cover entire dungeon
    const padding = TILE_SIZE * 2;
    this.physics.world.setBounds(
      minX + centerOffsetX - padding,
      minY + centerOffsetY - padding,
      dungeonWidth + padding * 2,
      dungeonHeight + padding * 2
    );
    
    // Position player at start room center
    const startRoom = this.dungeonFloor.startRoom;
    const startPos = roomPositions.get(startRoom.id)!;
    const playerX = startPos.x + startPos.width / 2 + centerOffsetX;
    const playerY = startPos.y + startPos.height / 2 + centerOffsetY;
    
    // Store player start position for later
    this.playerStartX = playerX;
    this.playerStartY = playerY;
    
    console.log(`Dungeon bounds: ${dungeonWidth}x${dungeonHeight}, offset: (${centerOffsetX}, ${centerOffsetY})`);
  }

  /**
   * Render a room template into a container with wall collision.
   */
  private renderRoomIntoContainer(room: RoomTemplate, container: Phaser.GameObjects.Container, containerX: number, containerY: number): void {
    const zone = this.zoneManager.getCurrentZone();
    const tilesetKey = zone?.tilesetKey || 'catacombs-tileset';
    
    for (let y = 0; y < room.height; y++) {
      for (let x = 0; x < room.width; x++) {
        const tileId = room.tiles[y][x];
        const pixelX = x * TILE_SIZE;
        const pixelY = y * TILE_SIZE;
        // World position for collision (container position + tile position)
        const worldX = containerX + pixelX + TILE_SIZE / 2;
        const worldY = containerY + pixelY + TILE_SIZE / 2;
        
        // Render based on tile type
        if (tileId === 1) {
          // Wall with collision
          const tileFrame = this.getWallTileVariation(x, y);
          const wall = this.add.image(pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2, tilesetKey, tileFrame)
            .setScale(2)
            .setDepth(DEPTH.WALLS);
          container.add(wall);
          
          // Add collision body for wall (in world space)
          const wallBody = this.add.rectangle(worldX, worldY, TILE_SIZE, TILE_SIZE)
            .setVisible(false);
          this.physics.add.existing(wallBody, true); // Static body
          this.wallBodies.push(wallBody);
        } else if (tileId === 2) {
          // Door tile - render as floor (doorway)
          const tileFrame = this.getFloorTileVariation(x, y);
          const floor = this.add.image(pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2, tilesetKey, tileFrame)
            .setScale(2)
            .setDepth(DEPTH.FLOOR);
          container.add(floor);
        } else if (tileId === 8) {
          // Torch on wall with collision
          const tileFrame = this.getWallTileVariation(x, y);
          const wall = this.add.image(pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2, tilesetKey, tileFrame)
            .setScale(2)
            .setDepth(DEPTH.WALLS);
          container.add(wall);
          
          // Add collision body for wall
          const wallBody = this.add.rectangle(worldX, worldY, TILE_SIZE, TILE_SIZE)
            .setVisible(false);
          this.physics.add.existing(wallBody, true);
          this.wallBodies.push(wallBody);
          
          // Add torch
          if (this.textures.exists('depths-torch')) {
            const torch = this.add.image(pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE - 4, 'depths-torch')
              .setOrigin(0.5, 1)
              .setScale(1.5)
              .setDepth(DEPTH.ITEMS);
            container.add(torch);
          }
          
          // Add glow
          const glow = this.add.circle(pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2, 40, 0xff8844, 0.15)
            .setDepth(DEPTH.EFFECTS);
          container.add(glow);
        } else {
          // Floor
          const tileFrame = this.getFloorTileVariation(x, y);
          const floor = this.add.image(pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2, tilesetKey, tileFrame)
            .setScale(2)
            .setDepth(DEPTH.FLOOR);
          container.add(floor);
        }
      }
    }
  }

  /**
   * Draw door outline at standard grid position (11x9 space).
   */
  private drawDoorOutlineInStandardSpace(direction: DoorDirection, container: Phaser.GameObjects.Container, standardWidth: number, standardHeight: number): void {
    let doorX = standardWidth / 2 - TILE_SIZE / 2;
    let doorY = standardHeight / 2 - TILE_SIZE / 2;
    
    switch (direction) {
      case DoorDirection.NORTH:
        doorX = standardWidth / 2 - TILE_SIZE / 2;
        doorY = 0;
        break;
      case DoorDirection.SOUTH:
        doorX = standardWidth / 2 - TILE_SIZE / 2;
        doorY = standardHeight - TILE_SIZE;
        break;
      case DoorDirection.EAST:
        doorX = standardWidth - TILE_SIZE;
        doorY = standardHeight / 2 - TILE_SIZE / 2;
        break;
      case DoorDirection.WEST:
        doorX = 0;
        doorY = standardHeight / 2 - TILE_SIZE / 2;
        break;
    }
    
    // Door outline
    const outlineColor = 0xf0c040;
    const graphics = this.add.graphics();
    graphics.lineStyle(2, outlineColor, 0.8);
    graphics.strokeRect(doorX + 2, doorY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
    graphics.setDepth(DEPTH.FLOOR_DECORATIONS + 1);
    container.add(graphics);
    
    // Glow
    const glow = this.add.rectangle(doorX + TILE_SIZE / 2, doorY + TILE_SIZE / 2, TILE_SIZE + 4, TILE_SIZE + 4, outlineColor, 0.15)
      .setDepth(DEPTH.FLOOR_DECORATIONS);
    container.add(glow);
    
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.1, to: 0.25 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  
  
  /**
   * Create a standard 11x9 room with walls at perimeter and doorways where connections exist.
   * Preserves interior features from the original template.
   */
  private createStandardRoom(template: RoomTemplate, targetWidth: number, targetHeight: number, doors: Array<{direction: DoorDirection, targetRoomId: string | null}>): RoomTemplate {
    // Create new tile array with walls around perimeter and floor inside
    const tiles: number[][] = [];
    
    for (let y = 0; y < targetHeight; y++) {
      tiles[y] = [];
      for (let x = 0; x < targetWidth; x++) {
        // Perimeter walls
        if (y === 0 || y === targetHeight - 1 || x === 0 || x === targetWidth - 1) {
          tiles[y][x] = 1; // Wall
        } else {
          tiles[y][x] = 0; // Floor
        }
      }
    }
    
    // Create doorways (gaps in walls) at standard positions for each connection
    const centerX = Math.floor(targetWidth / 2);
    const centerY = Math.floor(targetHeight / 2);
    
    for (const door of doors) {
      if (door.targetRoomId) {
        switch (door.direction) {
          case DoorDirection.NORTH:
            tiles[0][centerX] = 2; // Door tile at top center
            break;
          case DoorDirection.SOUTH:
            tiles[targetHeight - 1][centerX] = 2; // Door tile at bottom center
            break;
          case DoorDirection.EAST:
            tiles[centerY][targetWidth - 1] = 2; // Door tile at right center
            break;
          case DoorDirection.WEST:
            tiles[centerY][0] = 2; // Door tile at left center
            break;
        }
      }
    }
    
    // Copy ALL interior content from original template (including interior walls/pillars)
    const padX = Math.floor((targetWidth - template.width) / 2);
    const padY = Math.floor((targetHeight - template.height) / 2);
    
    // Copy the entire interior of the original template
    for (let y = 1; y < template.height - 1; y++) {
      for (let x = 1; x < template.width - 1; x++) {
        const tileId = template.tiles[y][x];
        const newX = x + padX;
        const newY = y + padY;
        
        // Only copy if within interior bounds (not overwriting perimeter)
        if (newX > 0 && newX < targetWidth - 1 && newY > 0 && newY < targetHeight - 1) {
          // Copy everything from the template interior (walls become pillars, obstacles, etc.)
          tiles[newY][newX] = tileId;
        }
      }
    }
    
    console.log(`Created room from template ${template.id} (${template.width}x${template.height} -> ${targetWidth}x${targetHeight})`);
    
    return {
      ...template,
      width: targetWidth,
      height: targetHeight,
      tiles
    };
  }

  /**
   * Setup collision between player and all wall bodies.
   */
  private setupWallCollision(): void {
    if (!this.player?.sprite) return;
    
    for (const wallBody of this.wallBodies) {
      this.physics.add.collider(this.player.sprite, wallBody);
    }
    
    console.log(`Setup collision for ${this.wallBodies.length} wall tiles`);
  }

  // Store player start position
  private playerStartX: number = 0;
  private playerStartY: number = 0;

  /**
   * Render a room with tiles and objects.
   * @param setPosition - Whether to set container position (false during transitions)
   */
  private renderRoom(room: RoomTemplate, setPosition: boolean = true): void {
    // Clear existing room content
    this.roomContainer.removeAll(true);
    
    // Calculate room offset to center it
    const roomPixelWidth = room.width * TILE_SIZE;
    const roomPixelHeight = room.height * TILE_SIZE;
    const offsetX = (GAME_WIDTH - roomPixelWidth) / 2;
    const offsetY = (GAME_HEIGHT - roomPixelHeight) / 2;
    
    // Only set position for initial load, not during transitions
    if (setPosition) {
      this.roomContainer.setPosition(offsetX, offsetY);
    }
    
    // Render tiles
    for (let y = 0; y < room.height; y++) {
      for (let x = 0; x < room.width; x++) {
        const tileId = room.tiles[y][x];
        this.renderTile(x, y, tileId);
      }
    }
    
    // Set world bounds for physics (add padding for tall objects)
    const padding = TILE_SIZE * 2; // Extra space for tall objects
    this.physics.world.setBounds(
      offsetX + TILE_SIZE,
      offsetY + TILE_SIZE,
      roomPixelWidth - TILE_SIZE * 2,
      roomPixelHeight - TILE_SIZE * 2 + padding
    );
  }
  
  /**
   * Render a single tile.
   */
  private renderTile(x: number, y: number, tileId: number): void {
    const pixelX = x * TILE_SIZE;
    const pixelY = y * TILE_SIZE;
    
    // Tile type mapping
    switch (tileId) {
      case 0: // Floor
        this.renderTransitionTile(pixelX, pixelY, x, y);
        break;
      case 2: // Door (floor with door)
        this.renderTransitionTile(pixelX, pixelY, x, y);
        this.storeDoorPosition(x, y);
        break;
      case 7: // Spawn point (floor)
        this.renderTransitionTile(pixelX, pixelY, x, y);
        break;
        
      case 1: // Wall
        this.renderWallTile(pixelX, pixelY, x, y);
        break;
        
      case 5: // Pedestal
        this.renderTransitionTile(pixelX, pixelY, x, y);
        this.renderPedestal(pixelX, pixelY);
        break;
        
      case 6: // Obstacle (barrel)
        this.renderTransitionTile(pixelX, pixelY, x, y);
        this.renderScaledObject(pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2, 'depths-barrel', DEPTH.ITEMS, 1.5);
        break;
        
      case 8: // Torch (wall-mounted)
        this.renderWallTile(pixelX, pixelY, x, y);
        this.renderWallMountedObject(pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE - 4, 'depths-torch', DEPTH.ITEMS + 1, 1.5);
        this.addTorchGlow(pixelX + TILE_SIZE / 2, pixelY + TILE_SIZE / 2);
        break;
        
      default:
        this.renderTransitionTile(pixelX, pixelY, x, y);
    }
  }
  
  
  /**
   * Render a wall tile using zone-specific tileset (scaled 2x).
   */
  private renderWallTile(x: number, y: number, gridX: number, gridY: number): void {
    // Get current zone tileset
    const zone = this.zoneManager.getCurrentZone();
    const tilesetKey = zone?.tilesetKey || 'depths-tileset';
    
    // Use wall tile from tileset with variation (scaled 2x)
    const tileFrame = this.getWallTileVariation(gridX, gridY);
    const wall = this.add.image(x + TILE_SIZE / 2, y + TILE_SIZE / 2, tilesetKey, tileFrame)
      .setScale(2)
      .setDepth(DEPTH.WALLS);
    this.roomContainer.add(wall);
  }
  
  /**
   * Get deterministic tile variation based on grid position.
   * Uses better hash to avoid diagonal patterns.
   */
  private getFloorTileVariation(gridX: number, gridY: number): number {
    // Better pseudo-random hash to avoid linear patterns
    let hash = (gridX * 73) ^ (gridY * 37);
    hash = ((hash >> 16) ^ hash) * 0x85ebca6b;
    hash = ((hash >> 16) ^ hash) * 0xc2b2ae35;
    hash = ((hash >> 16) ^ hash) & 0xFFFF;
    return hash % 16; // Frames 0-15
  }
  
  /**
   * Get deterministic wall tile variation based on grid position.
   */
  private getWallTileVariation(gridX: number, gridY: number): number {
    // Better pseudo-random hash for walls
    let hash = (gridX * 59) ^ (gridY * 97);
    hash = ((hash >> 16) ^ hash) * 0x85ebca6b;
    hash = ((hash >> 16) ^ hash) * 0xc2b2ae35;
    hash = ((hash >> 16) ^ hash) & 0xFFFF;
    return 16 + (hash % 8); // Frames 16-23
  }
  
  /**
   * Render floor with edge detection for walls.
   */
  private renderTransitionTile(x: number, y: number, gridX: number, gridY: number): void {
    // Check neighbors
    const hasNorth = this.isWall(gridX, gridY - 1);
    const hasSouth = this.isWall(gridX, gridY + 1);
    const hasEast = this.isWall(gridX + 1, gridY);
    const hasWest = this.isWall(gridX - 1, gridY);
    
    // Get current zone tileset
    const zone = this.zoneManager.getCurrentZone();
    const tilesetKey = zone?.tilesetKey || 'depths-tileset';
    
    // Use tileset floor tile with variation (scaled 2x)
    const tileFrame = this.getFloorTileVariation(gridX, gridY);
    const floor = this.add.image(x + TILE_SIZE / 2, y + TILE_SIZE / 2, tilesetKey, tileFrame)
      .setScale(2)
      .setDepth(DEPTH.FLOOR);
    this.roomContainer.add(floor);
    
    // Add edge shadows near walls
    const shadowColor = 0x2a231e;
    const shadowSize = 4;
    
    if (hasNorth) {
      const shadow = this.add.rectangle(x + TILE_SIZE / 2, y + shadowSize / 2, TILE_SIZE, shadowSize, shadowColor, 0.4)
        .setDepth(DEPTH.FLOOR_DECORATIONS);
      this.roomContainer.add(shadow);
    }
    if (hasSouth) {
      const shadow = this.add.rectangle(x + TILE_SIZE / 2, y + TILE_SIZE - shadowSize / 2, TILE_SIZE, shadowSize, shadowColor, 0.4)
        .setDepth(DEPTH.FLOOR_DECORATIONS);
      this.roomContainer.add(shadow);
    }
    if (hasWest) {
      const shadow = this.add.rectangle(x + shadowSize / 2, y + TILE_SIZE / 2, shadowSize, TILE_SIZE, shadowColor, 0.4)
        .setDepth(DEPTH.FLOOR_DECORATIONS);
      this.roomContainer.add(shadow);
    }
    if (hasEast) {
      const shadow = this.add.rectangle(x + TILE_SIZE - shadowSize / 2, y + TILE_SIZE / 2, shadowSize, TILE_SIZE, shadowColor, 0.4)
        .setDepth(DEPTH.FLOOR_DECORATIONS);
      this.roomContainer.add(shadow);
    }
  }
  
  /**
   * Check if a tile is a wall.
   */
  private isWall(gridX: number, gridY: number): boolean {
    if (!this.currentRoom) return false;
    if (gridX < 0 || gridX >= this.currentRoom.width) return true;
    if (gridY < 0 || gridY >= this.currentRoom.height) return true;
    return this.currentRoom.tiles[gridY][gridX] === 1;
  }
  
  /**
   * Render a pedestal.
   */
  private renderPedestal(x: number, y: number): void {
    const pedestal = this.add.rectangle(
      x + TILE_SIZE / 2,
      y + TILE_SIZE / 2,
      TILE_SIZE - 8,
      TILE_SIZE - 8,
      0x5a5a7a
    ).setDepth(DEPTH.FLOOR_DECORATIONS);
    this.roomContainer.add(pedestal);
  }
  
  /**
   * Render a scaled object sprite centered on position.
   */
  private renderScaledObject(x: number, y: number, texture: string, depth: number, scale: number = 1): void {
    if (this.textures.exists(texture)) {
      const obj = this.add.image(x, y, texture)
        .setOrigin(0.5, 0.5)
        .setScale(scale)
        .setDepth(depth);
      this.roomContainer.add(obj);
    }
  }
  
  /**
   * Render a wall-mounted object (like torches) - stores position for later collision setup.
   */
  private renderWallMountedObject(x: number, y: number, texture: string, depth: number, scale: number = 1): void {
    if (this.textures.exists(texture)) {
      // Add visual sprite to room container (local coordinates)
      const obj = this.add.image(x, y, texture)
        .setOrigin(0.5, 1)  // Anchor at bottom-center
        .setScale(scale)
        .setDepth(depth);
      this.roomContainer.add(obj);
      
      // Store position for collision setup after player exists
      this.torchPositions.push({ x, y });
    }
  }
  
  /**
   * Create torch collision bodies after player is set up.
   * Note: Torches are on wall tiles which already block movement.
   * This is now a no-op since wall tiles handle collision.
   */
  private createTorchColliders(): void {
    // Torches are rendered on wall tiles (tile 8 = torch on wall)
    // Wall tiles already have collision, so no extra collision needed
    // Just clear the stored positions
    this.torchPositions = [];
  }
  
  /**
   * Store door position for later trigger creation.
   * Note: This is now deprecated - use createDoorTriggersFromDungeon instead.
   */
  private storeDoorPosition(gridX: number, gridY: number): void {
    // Determine door direction based on room boundaries (more reliable)
    let direction: DoorDirection = DoorDirection.NORTH;
    
    if (gridY === 0) direction = DoorDirection.NORTH;
    else if (gridY === this.currentRoom.height - 1) direction = DoorDirection.SOUTH;
    else if (gridX === 0) direction = DoorDirection.WEST;
    else if (gridX === this.currentRoom.width - 1) direction = DoorDirection.EAST;
    
    this.doorPositions.push({ x: gridX, y: gridY, direction });
  }

/**
   * Transition to a new room with smooth walking transition.
   */
  private transitionToRoom(direction: string): void {
    if (this.isTransitioning) return;
    
    this.isTransitioning = true;
    
    // Store old room container for transition
    const oldRoomContainer = this.roomContainer;
    oldRoomContainer.setAlpha(1);
    
    // Create new room container for the adjacent room
    this.roomContainer = this.add.container(0, 0);
    
    // Calculate offset for new room based on direction
    const roomPixelWidth = this.currentRoom.width * TILE_SIZE;
    const roomPixelHeight = this.currentRoom.height * TILE_SIZE;
    
    let offsetX = 0;
    let offsetY = 0;
    
    switch (direction) {
      case 'north':
        offsetY = -roomPixelHeight;
        break;
      case 'south':
        offsetY = roomPixelHeight;
        break;
      case 'east':
        offsetX = roomPixelWidth;
        break;
      case 'west':
        offsetX = -roomPixelWidth;
        break;
    }
    
    // Position new room adjacent to current room
    const baseOffsetX = (GAME_WIDTH - roomPixelWidth) / 2;
    const baseOffsetY = (GAME_HEIGHT - roomPixelHeight) / 2;
    this.roomContainer.setPosition(baseOffsetX + offsetX, baseOffsetY + offsetY);
    
    // Generate the new room content
    this.generateNewRoom(direction);
    
    // Animate camera to follow player into new room
    this.tweens.add({
      targets: this.cameras.main,
      scrollX: offsetX,
      scrollY: offsetY,
      duration: 400,
      ease: 'Power2',
      onComplete: () => {
        // Destroy old room
        oldRoomContainer.destroy();
        
        // Reset camera and room position
        this.cameras.main.setScroll(0, 0);
        this.roomContainer.setPosition(baseOffsetX, baseOffsetY);
        
        this.isTransitioning = false;
      }
    });
  }

/**
   * Navigate to connected room based on entry direction.
   */
  private generateNewRoom(entryDirection: string): void {
    // Clear door positions for new room
    this.doorPositions = [];
    this.torchPositions = [];
    
    // Convert direction string to DoorDirection enum
    const directionMap: Record<string, DoorDirection> = {
      'north': DoorDirection.NORTH,
      'south': DoorDirection.SOUTH,
      'east': DoorDirection.EAST,
      'west': DoorDirection.WEST
    };
    const doorDir = directionMap[entryDirection];
    
    // Find connected room in dungeon map
    const door = this.currentDungeonRoom.getDoor(doorDir);
    if (!door || !door.targetRoomId) {
      console.error('No connected room found for direction:', entryDirection);
      return;
    }
    const connectedRoomId = door.targetRoomId;
    
    // Find the connected room in our dungeon
    const connectedRoom = this.dungeonFloor.rooms.find(r => r.id === connectedRoomId);
    if (!connectedRoom) {
      console.error('Connected room not found:', connectedRoomId);
      return;
    }
    
    // Update current dungeon room
    this.currentDungeonRoom = connectedRoom;
    this.visitedRooms.add(connectedRoom.id);
    
    console.log('Navigating to room:', connectedRoom.id, 'Type:', connectedRoom.type);
    
    // Get room template data
    const roomsData = this.cache.json.get('rooms');
    if (!roomsData?.rooms) return;
    
    // Get a room template that matches the dungeon room type
    const zone = this.zoneManager.getCurrentZone();
    const roomTemplate = this.getRoomTemplateForDungeonRoom(connectedRoom, roomsData.rooms);
    
    // Render new room (container position already set in transitionToRoom)
    this.currentRoom = roomTemplate;
    this.renderRoom(roomTemplate, false);
    
    // Create door triggers for new room based on dungeon connections
    this.createDoorTriggersFromDungeon();
    
    // Update background color for zone
    this.cameras.main.setBackgroundColor(zone?.ambientColor || '#1a1a2e');
    
    // Position player at the entry point of new room
    this.positionPlayerAtDoor(entryDirection);
  }

  /**
   * Get a room template that matches the dungeon room type.
   * Ensures unique templates and prevents adjacent rooms from having the same template.
   */
  private getRoomTemplateForDungeonRoom(dungeonRoom: Room, templates: RoomTemplate[]): RoomTemplate {
    // Check if we already assigned a template to this room
    const existingAssignment = this.roomTemplateAssignments.get(dungeonRoom.id);
    if (existingAssignment) {
      const existing = templates.find(t => t.id === existingAssignment);
      if (existing) return existing;
    }
    
    // Map dungeon room type to template type
    const typeMap: Record<string, string> = {
      'start': 'start',
      'normal': 'normal',
      'boss': 'boss',
      'treasure': 'treasure',
      'shop': 'shop',
      'hub': 'hub'
    };
    
    const targetType = typeMap[dungeonRoom.type] || 'normal';
    
    // Get templates used by adjacent rooms
    const adjacentTemplateIds = new Set<string>();
    const doors = dungeonRoom.getDoors();
    for (const door of doors) {
      if (door.targetRoomId) {
        const adjacentTemplateId = this.roomTemplateAssignments.get(door.targetRoomId);
        if (adjacentTemplateId) {
          adjacentTemplateIds.add(adjacentTemplateId);
        }
      }
    }
    
    // Find matching templates that haven't been used
    let matchingTemplates = templates.filter(t => 
      t.type === targetType && 
      !this.usedTemplateIds.has(t.id)
    );
    
    // Further filter to avoid same template as adjacent rooms
    if (matchingTemplates.length > 1) {
      const nonAdjacentMatching = matchingTemplates.filter(t => !adjacentTemplateIds.has(t.id));
      if (nonAdjacentMatching.length > 0) {
        matchingTemplates = nonAdjacentMatching;
      }
    }
    
    // If no unused templates, allow reuse but still avoid adjacent duplicates
    if (matchingTemplates.length === 0) {
      matchingTemplates = templates.filter(t => 
        t.type === targetType && 
        !adjacentTemplateIds.has(t.id)
      );
    }
    
    // Final fallback - any matching type
    if (matchingTemplates.length === 0) {
      matchingTemplates = templates.filter(t => t.type === targetType);
    }
    
    // If still no match, use any normal room
    if (matchingTemplates.length === 0) {
      const normalRooms = templates.filter(t => 
        t.type === 'normal' && 
        !this.usedTemplateIds.has(t.id) &&
        !adjacentTemplateIds.has(t.id)
      );
      if (normalRooms.length > 0) {
        matchingTemplates = normalRooms;
      } else {
        matchingTemplates = templates.filter(t => t.type === 'normal');
      }
    }
    
    // Absolute fallback
    if (matchingTemplates.length === 0) {
      return templates[0];
    }
    
    // Pick a random matching template
    const selected = matchingTemplates[Math.floor(Math.random() * matchingTemplates.length)];
    
    // Track the assignment
    this.usedTemplateIds.add(selected.id);
    this.roomTemplateAssignments.set(dungeonRoom.id, selected.id);
    
    console.log(`Room ${dungeonRoom.id} (${dungeonRoom.type}) -> Template: ${selected.id}`);
    
    return selected;
  }

  /**
   * Draw a visual outline around a door to indicate it's an exit.
   */
  private drawDoorOutline(gridX: number, gridY: number, direction: DoorDirection): void {
    const x = gridX * TILE_SIZE;
    const y = gridY * TILE_SIZE;
    
    // Door outline color (golden/yellow for visibility)
    const outlineColor = 0xf0c040;
    const outlineAlpha = 0.8;
    const lineWidth = 2;
    
    // Create graphics object for the outline
    const graphics = this.add.graphics();
    graphics.lineStyle(lineWidth, outlineColor, outlineAlpha);
    
    // Draw outline based on door direction (open side faces inward)
    switch (direction) {
      case DoorDirection.NORTH:
        // Door at top - draw U shape opening downward
        graphics.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        break;
      case DoorDirection.SOUTH:
        // Door at bottom - draw U shape opening upward
        graphics.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        break;
      case DoorDirection.EAST:
        // Door at right - draw U shape opening leftward
        graphics.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        break;
      case DoorDirection.WEST:
        // Door at left - draw U shape opening rightward
        graphics.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        break;
    }
    
    // Add subtle glow effect
    const glow = this.add.rectangle(
      x + TILE_SIZE / 2,
      y + TILE_SIZE / 2,
      TILE_SIZE + 4,
      TILE_SIZE + 4,
      outlineColor,
      0.15
    ).setDepth(DEPTH.FLOOR_DECORATIONS);
    
    // Animate the glow
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.1, to: 0.25 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    graphics.setDepth(DEPTH.FLOOR_DECORATIONS + 1);
    this.roomContainer.add(graphics);
    this.roomContainer.add(glow);
  }

  /**
   * Create door triggers based on dungeon room connections.
   */
  private createDoorTriggersFromDungeon(): void {
    // Get room container offset for world coordinates
    const roomPixelWidth = this.currentRoom.width * TILE_SIZE;
    const roomPixelHeight = this.currentRoom.height * TILE_SIZE;
    const offsetX = (GAME_WIDTH - roomPixelWidth) / 2;
    const offsetY = (GAME_HEIGHT - roomPixelHeight) / 2;
    
    // Create triggers only for doors that exist in the dungeon
    const doors = this.currentDungeonRoom.getDoors();
    
    for (const door of doors) {
      if (!door.targetRoomId) continue;
      
      const direction = door.direction;
      
      // Calculate door position based on direction
      let doorX = this.currentRoom.width / 2;
      let doorY = this.currentRoom.height / 2;
      
      switch (direction) {
        case DoorDirection.NORTH:
          doorX = this.currentRoom.width / 2;
          doorY = 0;
          break;
        case DoorDirection.SOUTH:
          doorX = this.currentRoom.width / 2;
          doorY = this.currentRoom.height - 1;
          break;
        case DoorDirection.EAST:
          doorX = this.currentRoom.width - 1;
          doorY = this.currentRoom.height / 2;
          break;
        case DoorDirection.WEST:
          doorX = 0;
          doorY = this.currentRoom.height / 2;
          break;
      }
      
      // Calculate world position
      const worldX = Math.floor(doorX) * TILE_SIZE + TILE_SIZE / 2 + offsetX;
      const worldY = Math.floor(doorY) * TILE_SIZE + TILE_SIZE / 2 + offsetY;
      
      // Store door position for player positioning
      this.doorPositions.push({ x: Math.floor(doorX), y: Math.floor(doorY), direction });
      
      // Draw door outline indicator
      this.drawDoorOutline(Math.floor(doorX), Math.floor(doorY), direction);
      
      // Create invisible zone for overlap detection - sized to match door opening (1 tile)
      const trigger = this.add.zone(worldX, worldY, TILE_SIZE, TILE_SIZE);
      this.physics.add.existing(trigger, true);
      
      // Add overlap detection with player
      const dir = direction;
      this.physics.add.overlap(this.player.sprite, trigger, () => {
        if (!this.isTransitioning) {
          this.transitionToRoom(dir);
        }
      });
    }
  }

/**
   * Position player at opposite door based on entry direction.
   */
  private positionPlayerAtDoor(entryDirection: string): void {
    // Find opposite door position in the new room
    const roomOffsetX = (GAME_WIDTH - this.currentRoom!.width * TILE_SIZE) / 2;
    const roomOffsetY = (GAME_HEIGHT - this.currentRoom!.height * TILE_SIZE) / 2;
    
    // Default to center of room
    let newX = GAME_WIDTH / 2;
    let newY = GAME_HEIGHT / 2;
    
    // Map entry direction to opposite door direction
    const oppositeMap: Record<string, DoorDirection> = {
      'north': DoorDirection.SOUTH,
      'south': DoorDirection.NORTH,
      'west': DoorDirection.EAST,
      'east': DoorDirection.WEST
    };
    const oppositeDir = oppositeMap[entryDirection];
    
    // Try to find the opposite door in the new room
    const oppositeDoor = this.doorPositions.find(door => door.direction === oppositeDir);
    
    if (oppositeDoor) {
      // Spawn at the opposite door position (slightly inside the room)
      newX = roomOffsetX + oppositeDoor.x * TILE_SIZE + TILE_SIZE / 2;
      newY = roomOffsetY + oppositeDoor.y * TILE_SIZE + TILE_SIZE / 2;
      
      // Move player slightly inside the room to avoid immediate re-trigger
      switch (oppositeDoor.direction) {
        case DoorDirection.NORTH: newY += TILE_SIZE * 2; break;
        case DoorDirection.SOUTH: newY -= TILE_SIZE * 2; break;
        case DoorDirection.WEST: newX += TILE_SIZE * 2; break;
        case DoorDirection.EAST: newX -= TILE_SIZE * 2; break;
      }
    } else {
      // No opposite door found, spawn at center
      console.log('No opposite door found, spawning at center');
    }
    
    if (this.player) {
      this.player.setPosition(newX, newY);
    }
  }

/**
   * Setup player collisions with room walls.
   */
  private setupPlayerCollisions(): void {
    // This would be expanded to handle wall collisions
    // For now, torches already have collision
  }

/**
   * Add torch glow effect (warm orange).
   */
  private addTorchGlow(x: number, y: number): void {
    const glow = this.add.circle(x, y, 40, 0xff8844, 0.15)
      .setDepth(DEPTH.EFFECTS);
    
    // Animate glow with flicker
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.1, to: 0.25 },
      scale: { from: 0.9, to: 1.2 },
      duration: 600 + Math.random() * 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    this.roomContainer.add(glow);
  }
  
  /**
   * Create and initialize the player.
   */
  private setupPlayer(): void {
    // Find spawn point (tile 7) in room
    let spawnX = GAME_WIDTH / 2;
    let spawnY = GAME_HEIGHT / 2;
    
    if (this.currentRoom) {
      for (let y = 0; y < this.currentRoom.height; y++) {
        for (let x = 0; x < this.currentRoom.width; x++) {
          if (this.currentRoom.tiles[y][x] === 7) {
            // Calculate world position
            const roomOffsetX = (GAME_WIDTH - this.currentRoom.width * TILE_SIZE) / 2;
            const roomOffsetY = (GAME_HEIGHT - this.currentRoom.height * TILE_SIZE) / 2;
            spawnX = roomOffsetX + x * TILE_SIZE + TILE_SIZE / 2;
            spawnY = roomOffsetY + y * TILE_SIZE + TILE_SIZE / 2;
            break;
          }
        }
      }
    }
    
    // Create player with selected character
    this.player = new Player(this, spawnX, spawnY, this.startData.character);
    this.player.sprite.setDepth(DEPTH.PLAYER);
    
    // Camera follows player
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
  }
  
  /**
   * Set up the heads-up display.
   */
  private setupUI(): void {
    // Room name display
    const _roomName = this.add.text(GAME_WIDTH / 2, 30, 'The Depths Hub', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#a5b4fc',
      stroke: '#1a1a2e',
      strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH.UI);
    
    // Character indicator
    const _charText = this.add.text(20, 20, `Character: ${this.startData.character}`, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff',
    }).setScrollFactor(0).setDepth(DEPTH.UI);
    
    // Controls hint
    const _controlsText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, 'WASD or Arrow Keys to move | ESC to pause', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#6b7280',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH.UI);
  }
  
  /**
   * Set up event listeners for game events.
   */
  private setupEventListeners(): void {
    this.events.on(EVENTS.PLAYER_DIED, this.onPlayerDeath, this);
    this.events.on(EVENTS.FLOOR_COMPLETED, this.onFloorComplete, this);
  }
  
  /**
   * Handle player input each frame.
   */
  private handleInput(): void {
    if (!this.player?.sprite?.body) return;
    
    // Movement direction
    const direction = new Phaser.Math.Vector2(0, 0);
    
    // Arrow keys
    if (this.cursors.left.isDown) direction.x -= 1;
    if (this.cursors.right.isDown) direction.x += 1;
    if (this.cursors.up.isDown) direction.y -= 1;
    if (this.cursors.down.isDown) direction.y += 1;
    
    // WASD
    if (this.wasd.A.isDown) direction.x -= 1;
    if (this.wasd.D.isDown) direction.x += 1;
    if (this.wasd.W.isDown) direction.y -= 1;
    if (this.wasd.S.isDown) direction.y += 1;
    
    // Apply movement
    this.player.handleMovement(direction);
  }
  
  /**
   * Update all entities.
   */
  private updateEntities(_delta: number): void {
    // Player update handled by physics
  }
  
  /**
   * Update all game systems.
   */
  private updateSystems(_delta: number): void {
    // Systems will be updated here
  }
  
  /**
   * Pause the game and show pause menu.
   */
  private pauseGame(): void {
    this.scene.pause();
    this.launchOverlay(SCENES.PAUSE);
  }
  
  /**
   * Handle player death.
   */
  private onPlayerDeath(): void {
    // TODO: Play death animation
    // TODO: Show game over after delay
    this.time.delayedCall(1500, () => {
      this.goToScene(SCENES.GAME_OVER);
    });
  }
  
  /**
   * Handle floor completion.
   */
  private onFloorComplete(): void {
    // TODO: Show floor complete UI
    // TODO: Generate next floor
  }
  
  /**
   * Clean up when scene shuts down.
   */
  shutdown(): void {
    super.shutdown();
    
    // Remove event listeners
    this.events.off(EVENTS.PLAYER_DIED, this.onPlayerDeath, this);
    this.events.off(EVENTS.FLOOR_COMPLETED, this.onFloorComplete, this);
  }
}
