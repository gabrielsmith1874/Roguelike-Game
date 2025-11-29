/**
 * @file GameScene.ts
 * @description Main gameplay scene where the action happens.
 */

import { BaseScene } from './BaseScene';
import { SCENES, EVENTS, TILE_SIZE, DEPTH, GAME_WIDTH, GAME_HEIGHT } from '@config/Constants';
import { Player } from '@entities/Player';

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
  width: number;
  height: number;
  tiles: number[][];
  spawns?: Array<{ x: number; y: number; type: string; entityId?: string }>;
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
  
  constructor() {
    super(SCENES.GAME);
  }
  
  init(data: GameStartData): void {
    this.startData = data || { continueRun: false, character: 'wizard', dungeon: 'depths' };
  }
  
  create(): void {
    super.create();
    
    // Fade in
    this.cameras.main.fadeIn(500, 0, 0, 0);
    
    this.setupInput();
    this.setupWorld();
    this.loadStartingRoom();
    this.setupPlayer();
    this.setupUI();
    this.setupEventListeners();
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
    // Set background color
    this.cameras.main.setBackgroundColor('#1a1a2e');
    
    // Create room container
    this.roomContainer = this.add.container(0, 0);
    
    // Adjust camera to show full room with tall objects
    this.cameras.main.setScroll(0, 0);
  }
  
  /**
   * Load and render the starting room (Depths Hub).
   */
  private loadStartingRoom(): void {
    // Get room data from cache
    const roomsData = this.cache.json.get('rooms');
    if (!roomsData?.rooms) {
      console.error('No room data found!');
      return;
    }
    
    // Find the depths hub room
    const hubRoom = roomsData.rooms.find((r: RoomTemplate) => r.id === 'depths_hub');
    if (!hubRoom) {
      console.error('Depths hub room not found!');
      return;
    }
    
    this.currentRoom = hubRoom;
    this.renderRoom(hubRoom);
  }
  
  /**
   * Render a room with tiles and objects.
   */
  private renderRoom(room: RoomTemplate): void {
    // Clear existing room
    this.roomContainer.removeAll(true);
    
    // Calculate room offset to center it
    const roomPixelWidth = room.width * TILE_SIZE;
    const roomPixelHeight = room.height * TILE_SIZE;
    const offsetX = (GAME_WIDTH - roomPixelWidth) / 2;
    const offsetY = (GAME_HEIGHT - roomPixelHeight) / 2;
    
    this.roomContainer.setPosition(offsetX, offsetY);
    
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
      case 2: // Door (floor with door)
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
   * Render a wall tile using tileset (scaled 2x).
   */
  private renderWallTile(x: number, y: number, gridX: number, gridY: number): void {
    // Use wall tile from tileset with variation (scaled 2x)
    const tileFrame = this.getWallTileVariation(gridX, gridY);
    const wall = this.add.image(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 'depths-tileset', tileFrame)
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
    
    // Use tileset floor tile with variation (scaled 2x)
    const tileFrame = this.getFloorTileVariation(gridX, gridY);
    const floor = this.add.image(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 'depths-tileset', tileFrame)
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
   * Render a wall-mounted object (like torches).
   */
  private renderWallMountedObject(x: number, y: number, texture: string, depth: number, scale: number = 1): void {
    if (this.textures.exists(texture)) {
      const obj = this.add.image(x, y, texture)
        .setOrigin(0.5, 1)  // Anchor at bottom-center
        .setScale(scale)
        .setDepth(depth);
      this.roomContainer.add(obj);
    }
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
    const roomName = this.add.text(GAME_WIDTH / 2, 30, 'The Depths Hub', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#a5b4fc',
      stroke: '#1a1a2e',
      strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH.UI);
    
    // Character indicator
    const charText = this.add.text(20, 20, `Character: ${this.startData.character}`, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff',
    }).setScrollFactor(0).setDepth(DEPTH.UI);
    
    // Controls hint
    const controlsText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, 'WASD or Arrow Keys to move | ESC to pause', {
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
