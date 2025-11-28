/**
 * @file PreloadScene.ts
 * @description Loads all game assets with progress display.
 */

import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '@config/Constants';
import { RoomComponentRegistry } from '@dungeon/RoomComponentRegistry';

/**
 * Preload scene - handles loading all game assets.
 * Displays a loading bar while assets load.
 */
export class PreloadScene extends Phaser.Scene {
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBox!: Phaser.GameObjects.Graphics;
  
  constructor() {
    super({ key: SCENES.PRELOAD });
  }
  
  preload(): void {
    this.createLoadingBar();
    this.setupLoadEvents();
    this.loadAssets();
  }
  
  create(): void {
    // Initialize data registries with loaded JSON
    this.initializeRegistries();
    
    // Clean up loading graphics
    this.progressBar.destroy();
    this.progressBox.destroy();
    
    // Go to main menu
    this.scene.start(SCENES.MENU);
  }
  
  /**
   * Initialize game data registries from loaded JSON.
   */
  private initializeRegistries(): void {
    // Load room components
    const roomData = this.cache.json.get('rooms');
    if (roomData) {
      RoomComponentRegistry.loadFromJSON(roomData);
    }
    
    // TODO: Load spell registry
    // const spellData = this.cache.json.get('spells');
    // if (spellData) SpellRegistry.loadFromJSON(spellData);
  }
  
  /**
   * Create the loading bar graphics.
   */
  private createLoadingBar(): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;
    const barWidth = 200;
    const barHeight = 20;
    
    // Background box
    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x222222, 0.8);
    this.progressBox.fillRect(
      centerX - barWidth / 2 - 5,
      centerY - barHeight / 2 - 5,
      barWidth + 10,
      barHeight + 10
    );
    
    // Progress bar (filled as loading progresses)
    this.progressBar = this.add.graphics();
  }
  
  /**
   * Set up loading progress events.
   */
  private setupLoadEvents(): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;
    const barWidth = 200;
    const barHeight = 20;
    
    this.load.on('progress', (value: number) => {
      this.progressBar.clear();
      this.progressBar.fillStyle(0x6366f1, 1);
      this.progressBar.fillRect(
        centerX - barWidth / 2,
        centerY - barHeight / 2,
        barWidth * value,
        barHeight
      );
    });
  }
  
  /**
   * Load all game assets.
   */
  private loadAssets(): void {
    // =========================================================================
    // JSON DATA (load first - other systems may depend on this)
    // =========================================================================
    
    this.load.json('rooms', 'assets/data/rooms/index.json');
    this.load.json('spells', 'assets/data/spells.json');
    this.load.json('enemies', 'assets/data/enemies.json');
    this.load.json('items', 'assets/data/items.json');
    
    // =========================================================================
    // AUDIO - MUSIC
    // Generated offline, stored in assets/audio/music/
    // =========================================================================
    
    this.load.audio('music_menu', ['assets/audio/music/menu.ogg', 'assets/audio/music/menu.mp3']);
    // this.load.audio('music_dungeon1', ['assets/audio/music/dungeon_floor1.ogg', 'assets/audio/music/dungeon_floor1.mp3']);
    // this.load.audio('music_dungeon2', ['assets/audio/music/dungeon_floor2.ogg', 'assets/audio/music/dungeon_floor2.mp3']);
    // this.load.audio('music_boss', ['assets/audio/music/boss.ogg', 'assets/audio/music/boss.mp3']);
    // this.load.audio('music_victory', ['assets/audio/music/victory.ogg', 'assets/audio/music/victory.mp3']);
    // this.load.audio('music_gameover', ['assets/audio/music/game_over.ogg', 'assets/audio/music/game_over.mp3']);
    
    // -----------------------------------------------------
    // DATA
    // -----------------------------------------------------
    // TODO: this.load.json('spells', 'assets/data/spells.json');
    // TODO: this.load.json('enemies', 'assets/data/enemies.json');
  }
}
