/**
 * @file MenuScene.ts
 * @description Main menu scene with animated UI and multiple sub-menus.
 */

import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '@config/Constants';
import { SaveManager } from '@managers/SaveManager';

/** Menu states */
type MenuState = 'main' | 'play' | 'dungeons' | 'characters' | 'achievements' | 'settings';

/** Character data */
interface CharacterInfo {
  id: string;
  name: string;
  description: string;
  color: number;
  unlocked: boolean;
  lore: string;
  stats: string[];
}

/** Dungeon data */
interface DungeonInfo {
  id: string;
  name: string;
  description: string;
  floors: number;
  color: number;
  unlocked: boolean;
  lore: string;
  stats: string[];
}

/**
 * Main menu scene with full navigation.
 */
export class MenuScene extends BaseScene {
  // UI containers for different menu states
  private mainContainer!: Phaser.GameObjects.Container;
  private playContainer!: Phaser.GameObjects.Container;
  private dungeonsContainer!: Phaser.GameObjects.Container;
  private charactersContainer!: Phaser.GameObjects.Container;
  private achievementsContainer!: Phaser.GameObjects.Container;
  private settingsContainer!: Phaser.GameObjects.Container;
  
  // Current state (assigned but never read - kept for potential future state management)
  // private currentState: MenuState = 'main';
  
  // Background particles
  private particles: Phaser.GameObjects.Graphics[] = [];
  
  // Selected options
  private selectedCharacter: string = 'wizard';
  private selectedDungeon: string = 'depths';
  
  // Character UI state
  private characterPortraits: Phaser.GameObjects.Container[] = [];
  private characterDetailsContainer!: Phaser.GameObjects.Container;
  private characterData: CharacterInfo[] = [];
  
  // Dungeon UI state
  private dungeonPortraits: Phaser.GameObjects.Container[] = [];
  private dungeonDetailsContainer!: Phaser.GameObjects.Container;
  private dungeonData: DungeonInfo[] = [];
  
  // Carousel state for arc dungeon selector
  private carouselOffset: number = 0;
  private hoveredDungeonId: string | null = null;
  
  // Animation tweens
  // private titleTween?: Phaser.Tweens.Tween; // Assigned but not referenced after creation
  
  // Hover sound cooldown
  private lastHoverTime: number = 0;
  private hoverCooldown: number = 100; // ms between hover sounds
  
  // Volume settings
  private masterVolume: number = 0.8;
  private musicVolume: number = 0.6;
  private sfxVolume: number = 0.8;

  // Active slider being dragged
  private activeSlider: { 
    container: Phaser.GameObjects.Container; 
    fill: Phaser.GameObjects.Graphics; 
    handle: Phaser.GameObjects.Arc; 
    valueText: Phaser.GameObjects.Text; 
    sliderWidth: number;
    callback: (value: number) => void;
  } | null = null;
  
  constructor() {
    super(SCENES.MENU);
  }
  
  preload(): void {
    // Load wizard character sprite
    this.load.image('wizard-south', 'assets/sprites/player/rotations/south.png');
  }
  
  create(): void {
    super.create();
    
    // Dark gradient background
    this.createBackground();
    
    // Floating particles
    this.createParticles();
    
    // Create all menu containers (hidden by default)
    this.createMainMenu();
    this.createPlayMenu();
    this.createDungeonsMenu();
    this.createCharactersMenu();
    this.createAchievementsMenu();
    this.createSettingsMenu();
    
    // Setup global slider drag handling
    this.setupSliderDragHandling();
    
    // Show main menu
    this.showMenu('main');
    
    // Setup audio unlock for browser autoplay policy
    this.setupAudioUnlock();
    
    // Try to play menu music (may be blocked until user clicks)
    this.playMenuMusic();
  }
  
  /**
   * Play menu background music.
   */
  private playMenuMusic(): void {
    // Check if already playing
    if (this.sound.get('music_menu')) {
      return;
    }
    
    // Try to play menu music
    if (this.cache.audio.exists('music_menu')) {
      // If audio context is locked, wait for user interaction
      if (this.sound.locked) {
        this.sound.once('unlocked', () => {
          this.sound.play('music_menu', {
            loop: true,
            volume: 0.5,
          });
        });
      } else {
        this.sound.play('music_menu', {
          loop: true,
          volume: 0.5,
        });
      }
    }
  }
  
  /**
   * Unlock audio on first interaction (required by browsers).
   */
  private setupAudioUnlock(): void {
    // Resume audio context on first click anywhere
    this.input.once('pointerdown', () => {
      // Check if sound manager has context (not NoAudioSoundManager)
      if ('context' in this.sound && this.sound.context?.state === 'suspended') {
        this.sound.context.resume();
      }
      // Try playing music again after unlock
      this.playMenuMusic();
    });
  }
  
  /**
   * Play a UI sound effect with optional cooldown for hover sounds.
   */
  private playUISound(key: 'click' | 'hover' | 'back' | 'start'): void {
    // Apply cooldown only for hover sounds to prevent overlap
    if (key === 'hover') {
      const now = Date.now();
      if (now - this.lastHoverTime < this.hoverCooldown) {
        return;
      }
      this.lastHoverTime = now;
    }
    
    const soundKey = `sfx_ui_${key}`;
    if (this.cache.audio.exists(soundKey)) {
      // Calculate effective volume (Master * SFX)
      const effectiveVolume = this.sfxVolume * this.masterVolume;
      if (effectiveVolume > 0) {
        this.sound.play(soundKey, { volume: effectiveVolume });
      }
    }
  }
  
  update(_time: number, _delta: number): void {
    // Animate particles
    this.updateParticles();
  }
  
  // ===========================================================================
  // BACKGROUND & EFFECTS
  // ===========================================================================
  
  private createBackground(): void {
    // Get actual screen dimensions for fullscreen coverage
    const width = Math.max(GAME_WIDTH, window.innerWidth);
    const height = Math.max(GAME_HEIGHT, window.innerHeight);
    
    // Gradient background - covers entire screen
    const graphics = this.add.graphics();
    
    // Dark purple to black gradient
    const colors = [0x1a0a2e, 0x16213e, 0x0f0f23];
    const gradientHeight = height / colors.length;
    
    colors.forEach((color, i) => {
      graphics.fillStyle(color, 1);
      graphics.fillRect(0, i * gradientHeight, width, gradientHeight + 1);
    });
    
    // Add some decorative elements
    graphics.lineStyle(1, 0x6366f1, 0.1);
    for (let i = 0; i < 20; i++) {
      const y = Phaser.Math.Between(0, height);
      graphics.lineBetween(0, y, width, y);
    }
    
    // Also set camera background color as fallback
    this.cameras.main.setBackgroundColor(0x0f0f23);
  }
  
  private createParticles(): void {
    // Create floating magical particles
    for (let i = 0; i < 30; i++) {
      const particle = this.add.graphics();
      const size = Phaser.Math.Between(1, 3);
      const color = Phaser.Math.RND.pick([0x6366f1, 0xa855f7, 0x3b82f6, 0x8b5cf6]);
      
      particle.fillStyle(color, Phaser.Math.FloatBetween(0.3, 0.7));
      particle.fillCircle(0, 0, size);
      
      particle.x = Phaser.Math.Between(0, GAME_WIDTH);
      particle.y = Phaser.Math.Between(0, GAME_HEIGHT);
      particle.setData('speed', Phaser.Math.FloatBetween(0.2, 0.8));
      particle.setData('drift', Phaser.Math.FloatBetween(-0.3, 0.3));
      
      this.particles.push(particle);
    }
  }
  
  private updateParticles(): void {
    for (const particle of this.particles) {
      particle.y -= particle.getData('speed');
      particle.x += particle.getData('drift');
      
      // Wrap around
      if (particle.y < -10) {
        particle.y = GAME_HEIGHT + 10;
        particle.x = Phaser.Math.Between(0, GAME_WIDTH);
      }
      if (particle.x < -10) particle.x = GAME_WIDTH + 10;
      if (particle.x > GAME_WIDTH + 10) particle.x = -10;
    }
  }
  
  // ===========================================================================
  // MAIN MENU
  // ===========================================================================
  
  private createMainMenu(): void {
    this.mainContainer = this.add.container(0, 0);
    
    // Create atmospheric background elements
    this.createMainMenuBackground();
    
    // Game title with enhanced styling
    const title = this.add.text(GAME_WIDTH / 2, 100, 'ARCANE DEPTHS', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '72px',
      color: '#ffffff',
      stroke: '#6366f1',
      strokeThickness: 6,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: '#6366f1',
        blur: 20,
        stroke: true,
        fill: true
      }
    }).setOrigin(0.5);
    
    // Enhanced title animation
    this.tweens.add({
      targets: title,
      alpha: { from: 0.7, to: 1 },
      scaleX: { from: 0.98, to: 1.02 },
      scaleY: { from: 0.98, to: 1.02 },
      duration: 2500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    
    // Subtitle with gradient effect
    const subtitle = this.add.text(GAME_WIDTH / 2, 170, 'A Magic Roguelike Adventure', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#a855f7',
      fontStyle: 'italic',
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: '#a855f7',
        blur: 10,
        stroke: false,
        fill: true
      }
    }).setOrigin(0.5);
    
    // Redesigned menu layout with better spacing
    const buttonY = 260;
    const spacing = 70;
    
    // Primary action button (larger, more prominent)
    const playBtn = this.createEnhancedButton(GAME_WIDTH / 2, buttonY, 'START GAME', 0x22c55e, 320, 60, () => {
      this.showMenu('play');
    });
    
    // Secondary buttons in a more compact layout
    const dungeonsBtn = this.createStyledButton(GAME_WIDTH / 2, buttonY + spacing + 10, 'DUNGEONS', 0x8b5cf6, () => {
      this.showMenu('dungeons');
    });
    
    const charactersBtn = this.createStyledButton(GAME_WIDTH / 2, buttonY + spacing * 2, 'CHARACTERS', 0xa855f7, () => {
      this.showMenu('characters');
    });
    
    // Tertiary buttons (smaller, less prominent)
    const achievementsBtn = this.createCompactButton(GAME_WIDTH / 2 - 100, buttonY + spacing * 3, 'ACHIEVEMENTS', 0x7c3aed, () => {
      this.showMenu('achievements');
    });
    
    const settingsBtn = this.createCompactButton(GAME_WIDTH / 2 + 100, buttonY + spacing * 3, 'SETTINGS', 0x5b21b6, () => {
      this.showMenu('settings');
    });
    
    // Version text
    const version = this.add.text(GAME_WIDTH - 5, GAME_HEIGHT - 5, 'v0.1.0', {
      fontFamily: 'Arial',
      fontSize: '8px',
      color: '#666666',
    }).setOrigin(1, 1);
    
    this.mainContainer.add([title, subtitle, playBtn, dungeonsBtn, charactersBtn, achievementsBtn, settingsBtn, version]);
  }
  
  /**
   * Create atmospheric background elements for the play menu
   */
  private createPlayMenuBackground(): void {
    // Create smooth mystical gradient
    const gradient = this.add.graphics();
    // Use smoother color transitions to avoid banding
    gradient.fillGradientStyle(0x2d1b69, 0x2d1b69, 0x1e1b4b, 0x1e1b4b, 0.5);
    gradient.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Add second gradient layer for smoother transition
    const gradient2 = this.add.graphics();
    gradient2.fillGradientStyle(0x1e1b4b, 0x312e81, 0x312e81, 0x1e1b4b, 0.4);
    gradient2.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    this.playContainer.add([gradient, gradient2]);
    
    // Energy particles with trails
    for (let i = 0; i < 15; i++) {
      const particle = this.add.graphics();
      const size = Phaser.Math.Between(2, 5);
      const x = Phaser.Math.Between(50, GAME_WIDTH - 50);
      const y = Phaser.Math.Between(50, GAME_HEIGHT - 50);
      const color = Phaser.Math.RND.pick([0xa855f7, 0x8b5cf6, 0x7c3aed]);
      
      // Particle with glow
      particle.fillStyle(color, 0.1);
      particle.fillCircle(x, y, size * 1.5);
      particle.fillStyle(color, 0.6);
      particle.fillCircle(x, y, size);
      
      // Complex movement pattern
      this.tweens.add({
        targets: particle,
        y: y + Phaser.Math.Between(-40, 40),
        x: x + Phaser.Math.Between(-20, 20),
        alpha: { from: 0.2, to: 0.8 },
        duration: Phaser.Math.Between(3000, 6000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      this.playContainer.add(particle);
    }
    
    // Floating geometric patterns
    for (let i = 0; i < 8; i++) {
      const pattern = this.add.graphics();
      const x = Phaser.Math.Between(80, GAME_WIDTH - 80);
      const y = Phaser.Math.Between(80, GAME_HEIGHT - 80);
      const size = Phaser.Math.Between(10, 20);
      const color = Phaser.Math.RND.pick([0xa855f7, 0x8b5cf6]);
      
      // Create geometric pattern instead of emoticon
      pattern.lineStyle(1, color, 0.3);
      pattern.strokeCircle(0, 0, size);
      
      // Inner geometric pattern
      for (let j = 0; j < 4; j++) {
        const angle = (j / 4) * Math.PI * 2;
        pattern.beginPath();
        pattern.moveTo(0, 0);
        pattern.lineTo(Math.cos(angle) * size * 0.7, Math.sin(angle) * size * 0.7);
        pattern.strokePath();
      }
      
      pattern.setPosition(x, y);
      pattern.setAlpha(0.3);
      
      // Floating and rotating
      this.tweens.add({
        targets: pattern,
        y: y - Phaser.Math.Between(20, 40),
        alpha: { from: 0.1, to: 0.4 },
        angle: 360,
        duration: Phaser.Math.Between(8000, 12000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      this.playContainer.add(pattern);
    }
    
    // Add subtle aurora effect
    const aurora = this.add.graphics();
    aurora.fillGradientStyle(0xa855f7, 0x8b5cf6, 0x7c3aed, 0xa855f7, 0.1);
    aurora.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT / 3);
    
    this.tweens.add({
      targets: aurora,
      alpha: { from: 0.05, to: 0.15 },
      duration: 6000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    this.playContainer.add(aurora);
  }
  
  /**
   * Create atmospheric background elements for the main menu
   */
  private createMainMenuBackground(): void {
    // Create smooth gradient background overlay
    const gradient = this.add.graphics();
    // Use smoother color transitions to avoid banding
    gradient.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 0.6);
    gradient.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Add second gradient layer for smoother transition
    const gradient2 = this.add.graphics();
    gradient2.fillGradientStyle(0x16213e, 0x0f3460, 0x0f3460, 0x16213e, 0.4);
    gradient2.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    this.mainContainer.add([gradient, gradient2]);
    
    // Add mystical star field
    for (let i = 0; i < 50; i++) {
      const star = this.add.graphics();
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const size = Phaser.Math.Between(0.5, 2);
      const twinkle = Phaser.Math.FloatBetween(0.3, 1);
      
      star.fillStyle(0xffffff, twinkle);
      star.fillCircle(x, y, size);
      
      // Twinkling animation
      this.tweens.add({
        targets: star,
        alpha: { from: twinkle * 0.5, to: twinkle },
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      this.mainContainer.add(star);
    }
    
    // Floating magical orbs with different colors
    const orbColors = [0x6366f1, 0xa855f7, 0x8b5cf6, 0x7c3aed];
    for (let i = 0; i < 12; i++) {
      const orb = this.add.graphics();
      const size = Phaser.Math.Between(3, 8);
      const x = Phaser.Math.Between(50, GAME_WIDTH - 50);
      const y = Phaser.Math.Between(50, GAME_HEIGHT - 50);
      const color = Phaser.Math.RND.pick(orbColors);
      
      // Create glow effect
      orb.fillStyle(color, 0.1);
      orb.fillCircle(x, y, size * 2);
      orb.fillStyle(color, 0.3);
      orb.fillCircle(x, y, size);
      
      // Complex floating animation
      this.tweens.add({
        targets: orb,
        y: y + Phaser.Math.Between(-30, 30),
        x: x + Phaser.Math.Between(-15, 15),
        alpha: { from: 0.3, to: 0.8 },
        duration: Phaser.Math.Between(4000, 8000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      this.mainContainer.add(orb);
    }
    
    // Add magical geometric patterns
    for (let i = 0; i < 6; i++) {
      const pattern = this.add.graphics();
      const x = Phaser.Math.Between(100, GAME_WIDTH - 100);
      const y = Phaser.Math.Between(100, GAME_HEIGHT - 100);
      const size = Phaser.Math.Between(12, 20);
      const color = orbColors[i % orbColors.length];
      
      // Create geometric pattern instead of emoticon
      pattern.lineStyle(1, color, 0.3);
      pattern.strokeCircle(0, 0, size);
      
      // Inner star pattern
      for (let j = 0; j < 8; j++) {
        const angle = (j / 8) * Math.PI * 2;
        pattern.beginPath();
        pattern.moveTo(0, 0);
        pattern.lineTo(Math.cos(angle) * size * 0.8, Math.sin(angle) * size * 0.8);
        pattern.strokePath();
      }
      
      // Outer decorative ring
      pattern.strokeCircle(0, 0, size * 1.2);
      
      pattern.setPosition(x, y);
      pattern.setAlpha(0.2);
      
      // Slow rotation and fade
      this.tweens.add({
        targets: pattern,
        alpha: { from: 0.1, to: 0.3 },
        angle: 360,
        duration: Phaser.Math.Between(15000, 25000),
        repeat: -1,
        ease: 'Linear'
      });
      
      this.mainContainer.add(pattern);
    }
    
    // Create ethereal mist effect
    const mist = this.add.graphics();
    mist.fillStyle(0x6366f1, 0.05);
    mist.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 300);
    mist.fillCircle(GAME_WIDTH / 3, GAME_HEIGHT / 3, 200);
    mist.fillCircle(GAME_WIDTH * 2/3, GAME_HEIGHT * 2/3, 250);
    
    this.tweens.add({
      targets: mist,
      alpha: { from: 0.05, to: 0.15 },
      scaleX: { from: 1, to: 1.1 },
      scaleY: { from: 1, to: 1.1 },
      duration: 8000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  
    this.mainContainer.add(mist);
  }
  
  /**
   * Create atmospheric background elements for the dungeons menu
   */
  private createImmersiveDungeonBackground(): void {
    // Create multi-layered parallax background
    const bg1 = this.add.graphics();
    bg1.fillGradientStyle(0x0f0f23, 0x0f0f23, 0x1a1a2e, 0x1a1a2e, 1);
    bg1.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Add atmospheric fog effect
    const fog = this.add.graphics();
    fog.fillGradientStyle(0x1a1a2e, 0x16213e, 0x16213e, 0x1a1a2e, 0.3);
    fog.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Create animated mystical particles
    for (let i = 0; i < 20; i++) {
      const particle = this.add.graphics();
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const size = Phaser.Math.FloatBetween(1, 3);
      const color = Phaser.Math.RND.pick([0x6366f1, 0x8b5cf6, 0xa855f7, 0xc084fc]);
      
      particle.fillStyle(color, 0.6);
      particle.fillCircle(0, 0, size);
      particle.setPosition(x, y);
      
      // Floating animation
      this.tweens.add({
        targets: particle,
        y: y - 50,
        alpha: { from: 0.6, to: 0.1 },
        duration: Phaser.Math.Between(3000, 6000),
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000)
      });
      
      this.dungeonsContainer.add(particle);
    }
    
    // Add rotating magical symbols
    for (let i = 0; i < 6; i++) {
      const symbol = this.add.graphics();
      const x = Phaser.Math.Between(100, GAME_WIDTH - 100);
      const y = Phaser.Math.Between(100, GAME_HEIGHT - 100);
      
      symbol.lineStyle(1, 0x6366f1, 0.3);
      symbol.strokeCircle(0, 0, 20);
      symbol.strokeCircle(0, 0, 15);
      
      // Inner mystical pattern
      for (let j = 0; j < 6; j++) {
        const angle = (j / 6) * Math.PI * 2;
        symbol.beginPath();
        symbol.moveTo(0, 0);
        symbol.lineTo(Math.cos(angle) * 10, Math.sin(angle) * 10);
        symbol.strokePath();
      }
      
      symbol.setPosition(x, y);
      
      // Slow rotation
      this.tweens.add({
        targets: symbol,
        rotation: Math.PI * 2,
        duration: Phaser.Math.Between(20000, 40000),
        ease: 'Linear',
        repeat: -1
      });
      
      this.dungeonsContainer.add(symbol);
    }
    
    this.dungeonsContainer.add([bg1, fog]);
  }
  
  private createCharactersMenuBackground(): void {
    // Magic-themed gradient
    const gradient = this.add.graphics();
    gradient.fillGradientStyle(0x2d1b69, 0x2d1b69, 0x1e1b4b, 0x1e1b4b, 0.5);
    gradient.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    const gradient2 = this.add.graphics();
    gradient2.fillGradientStyle(0x1e1b4b, 0x312e81, 0x312e81, 0x1e1b4b, 0.4);
    gradient2.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    this.charactersContainer.add([gradient, gradient2]);
    
    // Add magical particles
    for (let i = 0; i < 8; i++) {
      const particle = this.add.graphics();
      const x = Phaser.Math.Between(50, GAME_WIDTH - 50);
      const y = Phaser.Math.Between(50, GAME_HEIGHT - 50);
      const size = Phaser.Math.Between(2, 4);
      const color = Phaser.Math.RND.pick([0xa855f7, 0x8b5cf6]);
      
      particle.fillStyle(color, 0.3);
      particle.fillCircle(x, y, size);
      
      this.tweens.add({
        targets: particle,
        y: y + Phaser.Math.Between(-20, 20),
        alpha: { from: 0.2, to: 0.5 },
        duration: Phaser.Math.Between(4000, 7000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      this.charactersContainer.add(particle);
    }
  }
  
  /**
   * Create atmospheric background elements for the achievements menu
   */
  private createAchievementsMenuBackground(): void {
    // Golden achievement-themed gradient
    const gradient = this.add.graphics();
    gradient.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x2d1b69, 0x2d1b69, 0.5);
    gradient.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    const gradient2 = this.add.graphics();
    gradient2.fillGradientStyle(0x2d1b69, 0xfbbf24, 0xfbbf24, 0x2d1b69, 0.3);
    gradient2.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    this.achievementsContainer.add([gradient, gradient2]);
    
    // Add golden sparkles
    for (let i = 0; i < 12; i++) {
      const sparkle = this.add.graphics();
      const x = Phaser.Math.Between(50, GAME_WIDTH - 50);
      const y = Phaser.Math.Between(50, GAME_HEIGHT - 50);
      const size = Phaser.Math.Between(1, 3);
      
      sparkle.fillStyle(0xfbbf24, 0.4);
      sparkle.fillCircle(x, y, size);
      
      this.tweens.add({
        targets: sparkle,
        alpha: { from: 0.1, to: 0.6 },
        duration: Phaser.Math.Between(2000, 4000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      this.achievementsContainer.add(sparkle);
    }
  }
  
  /**
   * Create atmospheric background elements for the settings menu
   */
  private createSettingsMenuBackground(): void {
    // Technical/cyber-themed gradient
    const gradient = this.add.graphics();
    gradient.fillGradientStyle(0x0f0f23, 0x0f0f23, 0x1e1b4b, 0x1e1b4b, 0.6);
    gradient.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    const gradient2 = this.add.graphics();
    gradient2.fillGradientStyle(0x1e1b4b, 0x374151, 0x374151, 0x1e1b4b, 0.3);
    gradient2.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    this.settingsContainer.add([gradient, gradient2]);
    
    // Add tech particles
    for (let i = 0; i < 6; i++) {
      const particle = this.add.graphics();
      const x = Phaser.Math.Between(50, GAME_WIDTH - 50);
      const y = Phaser.Math.Between(50, GAME_HEIGHT - 50);
      const size = Phaser.Math.Between(1, 2);
      
      particle.fillStyle(0x374151, 0.4);
      particle.fillCircle(x, y, size);
      
      this.tweens.add({
        targets: particle,
        alpha: { from: 0.2, to: 0.5 },
        duration: Phaser.Math.Between(3000, 5000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      this.settingsContainer.add(particle);
    }
  }
  
  /**
   * Create an enhanced primary button with glow effect
   */
  private createEnhancedButton(
    x: number,
    y: number,
    text: string,
    color: number,
    width: number,
    height: number,
    callback: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    
    // Glow effect background
    const glow = this.add.graphics();
    glow.fillStyle(color, 0.2);
    glow.fillRoundedRect(-width / 2 - 4, -height / 2 - 4, width + 8, height + 8, 10);
    
    // Button background
    const bg = this.add.graphics();
    const drawButton = (hover: boolean) => {
      bg.clear();
      bg.fillStyle(color, hover ? 0.9 : 0.7);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
      bg.lineStyle(3, color, 1);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
    };
    drawButton(false);
    
    // Button text
    const label = this.add.text(0, 0, text, {
      fontFamily: 'Arial Black',
      fontSize: '26px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    
    // Hit area
    const hitArea = this.add.rectangle(0, 0, width, height, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    
    hitArea.on('pointerover', () => {
      drawButton(true);
      label.setScale(1.05);
      this.playUISound('hover');
    });
    
    hitArea.on('pointerout', () => {
      drawButton(false);
      label.setScale(1);
    });
    
    hitArea.on('pointerdown', () => {
      this.playUISound('click');
      this.tweens.add({
        targets: container,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 100,
        yoyo: true,
        onComplete: callback,
      });
    });
    
    container.add([glow, bg, label, hitArea]);
    return container;
  }
  
  /**
   * Create a compact secondary button
   */
  private createCompactButton(
    x: number,
    y: number,
    text: string,
    color: number,
    callback: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const width = 180;
    const height = 40;
    
    // Button background
    const bg = this.add.graphics();
    const drawButton = (hover: boolean) => {
      bg.clear();
      bg.fillStyle(color, hover ? 0.7 : 0.3);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 6);
      bg.lineStyle(2, color, 1);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 6);
    };
    drawButton(false);
    
    // Button text
    const label = this.add.text(0, 0, text, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    
    // Hit area
    const hitArea = this.add.rectangle(0, 0, width, height, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    
    hitArea.on('pointerover', () => {
      drawButton(true);
      label.setScale(1.05);
      this.playUISound('hover');
    });
    
    hitArea.on('pointerout', () => {
      drawButton(false);
      label.setScale(1);
    });
    
    hitArea.on('pointerdown', () => {
      this.playUISound('click');
      this.tweens.add({
        targets: container,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 50,
        yoyo: true,
        onComplete: callback,
      });
    });
    
    container.add([bg, label, hitArea]);
    return container;
  }
  
  // ===========================================================================
  // PLAY MENU (Start Game)
  // ===========================================================================
  private createPlayMenu(): void {
    this.playContainer = this.add.container(0, 0);
    this.playContainer.setVisible(false);
    
    // Add background elements for play menu
    this.createPlayMenuBackground();

    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    const title = this.add.text(centerX, centerY - 120, 'BEGIN YOUR JOURNEY', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '48px',
      color: '#ffffff',
      stroke: '#6366f1',
      strokeThickness: 4,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: '#6366f1',
        blur: 15,
        stroke: true,
        fill: true
      }
    }).setOrigin(0.5);
    
    // Enhanced character and dungeon display
    const infoY = centerY - 40;
    
    const charLabel = this.add.text(centerX, infoY, 'Character: Wizard', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#a855f7',
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: '#a855f7',
        blur: 8,
        stroke: false,
        fill: true
      }
    }).setOrigin(0.5);
    
    const dungeonLabel = this.add.text(centerX, infoY + 30, 'Dungeon: The Depths', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#8b5cf6',
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: '#8b5cf6',
        blur: 8,
        stroke: false,
        fill: true
      }
    }).setOrigin(0.5).setName('dungeonLabel');
    
    // Continue button (if run in progress)
    const saves = SaveManager.getInstance();
    const continueY = centerY + 40;
    if (saves.hasRunInProgress()) {
      const continueBtn = this.createEnhancedButton(centerX, continueY, 'CONTINUE RUN', 0x22c55e, 280, 50, () => {
        this.startGame(true);
      });
      this.playContainer.add(continueBtn);
    }
    
    // New run button - primary action
    const newGameBtn = this.createEnhancedButton(
      centerX, 
      saves.hasRunInProgress() ? continueY + 70 : continueY, 
      'NEW RUN', 
      0x6366f1, 
      280, 
      50,
      () => {
        this.startGame(false);
      }
    );
    
    // Enhanced back button
    const backBtn = this.createBackButton(() => this.showMenu('main'));
    
    this.playContainer.add([title, charLabel, dungeonLabel, newGameBtn, backBtn]);
  }
  // ===========================================================================
  // DUNGEONS MENU
  // ===========================================================================
  
  private createDungeonsMenu(): void {
    this.dungeonsContainer = this.add.container(0, 0);
    this.dungeonsContainer.setVisible(false);
    
    // Create immersive dungeon background
    this.createImmersiveDungeonBackground();
    
    // Add title
    const title = this.createMenuTitle('SELECT DUNGEON');
    this.dungeonsContainer.add(title);
    
    // Enhanced dungeon data with visual themes
    const dungeons: DungeonInfo[] = [
      {
        id: 'depths',
        name: 'The Depths',
        description: 'A dark underground labyrinth',
        floors: 5,
        color: 0x6366f1,
        unlocked: true,
        lore: 'Beneath the ancient city lies a maze of forgotten tunnels, where shadows whisper secrets and treasures await the brave.',
        stats: [
          'Difficulty: ★★☆☆☆',
          'Enemies: Slimes, Goblins, Bats',
          'Boss: The Lurking Horror',
          'Rewards: Basic gear, Gold',
        ],
      },
      {
        id: 'crypt',
        name: 'Cursed Crypt',
        description: 'Ancient tombs of the undead',
        floors: 5,
        color: 0x64748b,
        unlocked: true,
        lore: 'Once a sacred burial ground, now corrupted by dark magic. The dead do not rest here—they hunger.',
        stats: [
          'Difficulty: ★★★☆☆',
          'Enemies: Skeletons, Wraiths, Ghouls',
          'Boss: The Lich King',
          'Rewards: Rare gear, Souls',
        ],
      },
      {
        id: 'volcano',
        name: 'Molten Core',
        description: 'Rivers of fire and flame',
        floors: 6,
        color: 0xef4444,
        unlocked: false,
        lore: 'Deep within the volcanic heart, fire elementals dance among rivers of molten rock. Only the fireproof survive.',
        stats: [
          'Difficulty: ★★★★☆',
          'Enemies: Fire Elementals, Magma Golems',
          'Boss: Inferno Drake',
          'Rewards: Epic gear, Ember Crystals',
        ],
      },
      {
        id: 'frost',
        name: 'Frozen Abyss',
        description: 'Eternal ice and darkness',
        floors: 6,
        color: 0x3b82f6,
        unlocked: false,
        lore: 'Where winter never ends and the cold seeps into your very soul. Ancient frost giants slumber beneath the ice.',
        stats: [
          'Difficulty: ★★★★★',
          'Enemies: Ice Wraiths, Frost Giants',
          'Boss: The Frozen One',
          'Rewards: Legendary gear, Frost Shards',
        ],
      },
    ];

    this.dungeonData = dungeons;
    this.dungeonPortraits = [];

    // Create circular dungeon hub layout
    this.createCircularDungeonHub(dungeons);
    
    // Create central detail display
    this.createCentralDetailDisplay();
    
    // Create floating action buttons
    this.createFloatingActions();

    // Back button
    const backBtn = this.createBackButton(() => this.showMenu('main'));
    this.dungeonsContainer.add(backBtn);

    // Initialize with selected dungeon
    this.showDungeonDetails(this.selectedDungeon, false);
  }

  // ===========================================================================
  // LEGACY DUNGEON METHODS (unused - replaced by circular hub system)
  // ===========================================================================
  
  /*
  private createDungeonStartButton(panelHeight: number): Phaser.GameObjects.Container {
    const btn = this.add.container(0, panelHeight / 2 - 35);
    const width = 140;
    const height = 36;

    const bg = this.add.graphics();
    bg.fillStyle(0x22c55e, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);

    const text = this.add.text(0, 0, 'START', {
      fontFamily: 'Arial Black',
      fontSize: '16px',
      color: '#ffffff',
    }).setOrigin(0.5);

    const hitArea = this.add.rectangle(0, 0, width, height, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x16a34a, 1);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
    });

    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x22c55e, 1);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
    });

    hitArea.on('pointerdown', () => {
      this.playUISound('click');
      this.showMenu('play');
    });

    btn.add([bg, text, hitArea]);
    return btn;
  }

  private createDungeonListItem(dungeon: DungeonInfo, x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const width = 150;
    const height = 65;
    container.setData('dungeonId', dungeon.id);

    // Item background
    const bg = this.add.graphics().setName('itemBg');
    const drawBg = (selected: boolean, hover: boolean = false) => {
      bg.clear();
      const alpha = selected ? 0.6 : (hover ? 0.4 : 0.2);
      const borderAlpha = selected ? 1 : 0.5;
      bg.fillStyle(dungeon.unlocked ? dungeon.color : 0x333333, alpha);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
      bg.lineStyle(selected ? 2 : 1, dungeon.unlocked ? dungeon.color : 0x444444, borderAlpha);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 8);
    };
    drawBg(dungeon.id === this.selectedDungeon);

    // Dungeon icon
    const icons: Record<string, string> = {
      depths: '🏰',
      crypt: '💀',
      volcano: '🌋',
      frost: '❄️',
    };
    const iconSize = 36;
    const iconBg = this.add.graphics();
    iconBg.fillStyle(0x111827, 1);
    iconBg.fillRoundedRect(-width / 2 + 8, -iconSize / 2, iconSize, iconSize, 6);

    const icon = this.add.text(-width / 2 + 8 + iconSize / 2, 0, dungeon.unlocked ? (icons[dungeon.id] || '?') : '🔒', {
      fontSize: '20px',
    }).setOrigin(0.5);

    // Name and description
    const name = this.add.text(-width / 2 + 45, -12, dungeon.name, {
      fontFamily: 'Arial Black',
      fontSize: '12px',
      color: dungeon.unlocked ? '#ffffff' : '#666666',
    });

    const desc = this.add.text(-width / 2 + 45, 4, dungeon.unlocked ? `${dungeon.floors} Floors` : 'Locked', {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: dungeon.unlocked ? '#9ca3af' : '#4b5563',
    });

    container.add([bg, iconBg, icon, name, desc]);

    // Interactivity
    if (dungeon.unlocked) {
      const hitArea = this.add.rectangle(0, 0, width, height, 0x000000, 0)
        .setInteractive({ useHandCursor: true });

      hitArea.on('pointerover', () => {
        if (dungeon.id !== this.selectedDungeon) {
          drawBg(false, true);
        }
      });

      hitArea.on('pointerout', () => {
        drawBg(dungeon.id === this.selectedDungeon);
      });

      hitArea.on('pointerdown', () => {
        this.playUISound('click');
        this.showDungeonDetails(dungeon.id);
        // Add rotation animation to put clicked dungeon at top
        this.rotateToDungeon(dungeon.id);
      });

      container.add(hitArea);
    }

    return container;
  }
  */

  // ===========================================================================
  // LEGACY ROTATION METHODS (replaced by arc carousel system)
  // ===========================================================================
  
  /*
  private rotateToDungeon(dungeonId: string): void {
    const rotatingContainer = this.dungeonsContainer.getByName('rotatingContainer') as Phaser.GameObjects.Container;
    if (!rotatingContainer) return;
    
    const dungeonIndex = this.dungeonData.findIndex(d => d.id === dungeonId);
    if (dungeonIndex === -1) return;
    
    // Calculate target rotation to put selected dungeon at top
    const dungeonsCount = this.dungeonData.length;
    const currentAngle = (dungeonIndex / dungeonsCount) * Math.PI * 2 - Math.PI / 2;
    const targetAngle = -Math.PI / 2; // Top position
    const rotationNeeded = targetAngle - currentAngle;
    
    // Animate rotation
    this.tweens.add({
      targets: rotatingContainer,
      rotation: rotationNeeded,
      duration: 800,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        // Normalize rotation to prevent buildup
        rotatingContainer.rotation = Phaser.Math.Wrap(rotatingContainer.rotation, -Math.PI, Math.PI);
      }
    });
  }
  
  private rotateToSelectedDungeon(animate: boolean = true): void {
    const rotatingContainer = this.dungeonsContainer.getByName('rotatingContainer') as Phaser.GameObjects.Container;
    if (!rotatingContainer) return;
    
    const dungeonIndex = this.dungeonData.findIndex(d => d.id === this.selectedDungeon);
    if (dungeonIndex === -1) return;
    
    // Calculate target rotation to put selected dungeon at top
    const dungeonsCount = this.dungeonData.length;
    const currentAngle = (dungeonIndex / dungeonsCount) * Math.PI * 2 - Math.PI / 2;
    const targetAngle = -Math.PI / 2; // Top position
    const rotationNeeded = targetAngle - currentAngle;
    
    if (animate) {
      // Animate rotation
      this.tweens.add({
        targets: rotatingContainer,
        rotation: rotationNeeded,
        duration: 800,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          // Normalize rotation to prevent buildup
          rotatingContainer.rotation = Phaser.Math.Wrap(rotatingContainer.rotation, -Math.PI, Math.PI);
        }
      });
    } else {
      // Set rotation immediately
      rotatingContainer.rotation = rotationNeeded;
    }
  }
  */
  
  private showDungeonDetails(dungeonId: string, animate: boolean = true): void {
    this.selectedDungeon = dungeonId;
    if (!this.dungeonDetailsContainer) return;
    const dungeon = this.dungeonData.find((d) => d.id === dungeonId);
    if (!dungeon) return;

    // Update circular node highlights
    this.dungeonPortraits.forEach((item) => {
      const id = item.getData('dungeonId') as string | undefined;
      const nodeBg = item.getByName('nodeBg') as Phaser.GameObjects.Graphics | null;
      if (!id || !nodeBg) return;

      const data = this.dungeonData.find((d) => d.id === id);
      const unlocked = data?.unlocked ?? false;
      const color = data?.color ?? 0x333333;
      const selected = id === dungeonId;
      const nodeSize = 60;

      nodeBg.clear();
      const alpha = selected ? 1 : 0.6;
      const scale = selected ? 1.1 : 1;
      const actualSize = (nodeSize / 2) * scale;

      if (unlocked) {
        nodeBg.fillStyle(color, alpha);
        nodeBg.fillCircle(0, 0, actualSize);
        nodeBg.lineStyle(selected ? 3 : 2, 0xffffff, selected ? 0.8 : 0.4);
      } else {
        nodeBg.fillStyle(0x333333, alpha);
        nodeBg.fillCircle(0, 0, actualSize);
        nodeBg.lineStyle(2, 0x666666, 0.4);
      }
      nodeBg.strokeCircle(0, 0, actualSize);
    });

    // Detail panel elements
    const nameText = this.dungeonDetailsContainer.getByName('dungeonName') as Phaser.GameObjects.Text | null;
    const loreText = this.dungeonDetailsContainer.getByName('dungeonLore') as Phaser.GameObjects.Text | null;
    const statsContainer = this.dungeonDetailsContainer.getByName('dungeonStatsContainer') as Phaser.GameObjects.Container | null;

    const applyContent = () => {
      if (nameText) {
        nameText.setText(dungeon.name);
        nameText.setColor(`#${dungeon.color.toString(16).padStart(6, '0')}`);
      }

      if (loreText) {
        loreText.setText(dungeon.lore);
      }

      // Clear and render stats
      if (statsContainer) {
        statsContainer.removeAll(true);
        
        const panelWidth = 500;
        let xOffset = -panelWidth / 2 + 20;
        const yOffset = 0;
        const spacing = 120;

        dungeon.stats.forEach((stat) => {
          const [label, value] = stat.split(': ');

          const labelText = this.add.text(xOffset, yOffset, label + ':', {
            fontFamily: 'Arial',
            fontSize: '11px',
            color: '#a5b4fc',
          });

          const valueText = this.add.text(xOffset, yOffset + 14, value, {
            fontFamily: 'Arial',
            fontSize: '10px',
            color: '#9ca3af',
          });

          // Hide the original star text if we're showing graphical stars
          if (label === 'Difficulty') {
            valueText.setVisible(false);
          }

          // Enhanced star display for difficulty (no bar)
          if (label === 'Difficulty') {
            const starCount = (value.match(/★/g) || []).length;
            const starSize = 14;
            const starSpacing = 16;
            const totalStarWidth = 5 * starSpacing - 2; // Total width of 5 stars
            
            // Calculate center of label text and center stars under it
            const labelWidth = labelText.width;
            const labelCenter = xOffset + labelWidth / 2;
            const starX = labelCenter - totalStarWidth / 2 + starSpacing / 2; // Centered under label
            const starY = yOffset + 20; // Adjusted to split the difference
            
            // Draw 5 stars with clear filled/empty distinction
            for (let i = 0; i < 5; i++) {
              const star = this.add.text(starX + i * starSpacing, starY, '★', {
                fontFamily: 'Arial',
                fontSize: `${starSize}px`,
                color: i < starCount ? `#${dungeon.color.toString(16).padStart(6, '0')}` : '#374151',
                shadow: {
                  offsetX: 1,
                  offsetY: 1,
                  color: '#000000',
                  blur: 2,
                  stroke: false,
                  fill: true
                }
              }).setOrigin(0.5);
              
              // Add glow effect for filled stars
              if (i < starCount) {
                const glow = this.add.text(starX + i * starSpacing, starY, '★', {
                  fontFamily: 'Arial',
                  fontSize: `${starSize}px`,
                  color: `#${dungeon.color.toString(16).padStart(6, '0')}`,
                  shadow: {
                    offsetX: 0,
                    offsetY: 0,
                    color: `#${dungeon.color.toString(16).padStart(6, '0')}`,
                    blur: 8,
                    stroke: false,
                    fill: true
                  }
                }).setOrigin(0.5).setAlpha(0.5);
                
                statsContainer.add(glow);
              }
              
              statsContainer.add(star);
            }
          }

          statsContainer.add([labelText, valueText]);
          xOffset += spacing;
        });
      }
    };

    // Animate panel content
    if (animate) {
      this.tweens.add({
        targets: this.dungeonDetailsContainer,
        alpha: 0,
        duration: 100,
        ease: 'Quad.easeIn',
        onComplete: () => {
          applyContent();
          this.tweens.add({
            targets: this.dungeonDetailsContainer,
            alpha: 1,
            duration: 200,
            ease: 'Quad.easeOut',
          });
        },
      });
    } else {
      applyContent();
    }
  }
  
  // ===========================================================================
  // CHARACTERS MENU
  // ===========================================================================
  
  private createCharactersMenu(): void {
    this.charactersContainer = this.add.container(0, 0);
    this.charactersContainer.setVisible(false);
    
    // Add enhanced background
    this.createCharactersMenuBackground();
    
    const title = this.createMenuTitle('SELECT CHARACTER');
    
    // Character data with lore and stats
    const characters: CharacterInfo[] = [
      {
        id: 'wizard',
        name: 'Wizard',
        description: 'Balanced magic user',
        color: 0x6366f1,
        unlocked: true,
        lore: 'Graduated from the Arcane Collegium with top honors, the Wizard weaves elemental forces into precise patterns, turning the battlefield into a chessboard of spell sigils.',
        stats: [
          'Difficulty: Normal',
          'Role: Balanced Caster',
          'Health: ★★★☆☆',
          'Damage: ★★★★☆',
          'Control: ★★★☆☆',
        ],
      },
      {
        id: 'pyro',
        name: 'Pyromancer',
        description: 'Fire specialist',
        color: 0xef4444,
        unlocked: true,
        lore: 'Once an apprentice blacksmith, the Pyromancer learned to speak to the forge. Now every spark is a promise and every ember a loaded spell.',
        stats: [
          'Difficulty: Hard',
          'Role: Burst DPS',
          'Health: ★★☆☆☆',
          'Damage: ★★★★★',
          'Mobility: ★★★☆☆',
        ],
      },
      {
        id: 'cryo',
        name: 'Cryomancer',
        description: 'Ice and control',
        color: 0x3b82f6,
        unlocked: false,
        lore: 'Whispers of winter follow the Cryomancer. Every step leaves frost, every word a drifting snowflake that slows time itself.',
        stats: [
          'Difficulty: Normal',
          'Role: Control Mage',
          'Health: ★★★☆☆',
          'Crowd Control: ★★★★★',
          'Damage: ★★★☆☆',
        ],
      },
      {
        id: 'storm',
        name: 'Stormcaller',
        description: 'Lightning speed',
        color: 0xfbbf24,
        unlocked: false,
        lore: 'The Stormcaller wears thunder as a cloak. Their spells crack the air, chaining lightning between foes faster than thought.',
        stats: [
          'Difficulty: Hard',
          'Role: Mobility Caster',
          'Health: ★★☆☆☆',
          'Damage: ★★★★☆',
          'Mobility: ★★★★★',
        ],
      },
      {
        id: 'shadow',
        name: 'Shadowmage',
        description: 'Stealth and damage over time',
        color: 0x7c3aed,
        unlocked: false,
        lore: 'Every dungeon has shadows. The Shadowmage simply decided to live in them, trading blood for whispers and blades for curses.',
        stats: [
          'Difficulty: Normal',
          'Role: DoT & Debuff',
          'Health: ★★★☆☆',
          'Damage Over Time: ★★★★★',
          'Burst Damage: ★★☆☆☆',
        ],
      },
    ];
    
    this.characterData = characters;
    this.characterPortraits = [];
    
    // Create character portraits in a centered row
    const portraitsY = 130;
    const spacing = 120;
    const totalWidth = (characters.length - 1) * spacing;
    const firstX = GAME_WIDTH / 2 - totalWidth / 2;
    
    characters.forEach((char, index) => {
      const portrait = this.createCharacterPortrait(char, firstX + index * spacing, portraitsY);
      this.characterPortraits.push(portrait);
      this.charactersContainer.add(portrait);
    });

    // Large character detail panel - two column layout
    const panelWidth = 720;
    const panelHeight = 300;
    const artSize = 140;
    const leftColX = -panelWidth / 2 + 40;  // Art + lore column
    const rightColX = 60;                    // Stats column
    const loreWidth = 240;
    const statsWidth = 200;

    // Slightly higher to keep clear of CRT bottom curve
    this.characterDetailsContainer = this.add.container(GAME_WIDTH / 2, 340);

    // Panel background
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x0a0a1a, 0.95);
    panelBg.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 16);
    panelBg.lineStyle(2, 0x4f46e5, 0.5);
    panelBg.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 16);

    // Character art frame (left side)
    const artFrame = this.add.graphics().setName('charArtFrame');
    artFrame.fillStyle(0x111827, 1);
    artFrame.fillRoundedRect(leftColX, -artSize / 2 - 20, artSize, artSize, 12);
    artFrame.lineStyle(3, 0x6366f1, 1);
    artFrame.strokeRoundedRect(leftColX, -artSize / 2 - 20, artSize, artSize, 12);

    const artIcon = this.add.text(leftColX + artSize / 2, -20, '?', {
      fontFamily: 'Arial Black',
      fontSize: '64px',
      color: '#ffffff',
    }).setOrigin(0.5).setName('charArtIcon');

    // Character sprite (for wizard, hidden by default)
    const artSprite = this.add.image(leftColX + artSize / 2, -20, 'wizard-south')
      .setOrigin(0.5)
      .setScale(4.5) // Scale up for detail panel (32px * 4.5 = 144px)
      .setVisible(false)
      .setName('charArtSprite');

    // Lore below art (left column)
    const loreLabel = this.add.text(leftColX, artSize / 2 - 10, 'Lore', {
      fontFamily: 'Arial Black',
      fontSize: '12px',
      color: '#a5b4fc',
    }).setName('charLoreLabel');

    const loreText = this.add.text(leftColX, artSize / 2 + 6, 'Character lore goes here.', {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#9ca3af',
      wordWrap: { width: loreWidth },
      lineSpacing: 3,
    }).setName('charLore');

    // Name and role (right column, top)
    const nameText = this.add.text(rightColX, -panelHeight / 2 + 30, 'Wizard', {
      fontFamily: 'Arial Black',
      fontSize: '28px',
      color: '#ffffff',
    }).setName('charName');

    const roleText = this.add.text(rightColX, -panelHeight / 2 + 62, 'Balanced magic user', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#a5b4fc',
    }).setName('charRole');

    // Divider line
    const divider = this.add.graphics();
    divider.lineStyle(1, 0x374151, 0.6);
    divider.beginPath();
    divider.moveTo(rightColX, -panelHeight / 2 + 85);
    divider.lineTo(rightColX + statsWidth, -panelHeight / 2 + 85);
    divider.strokePath();

    // Stats section (right column)
    const statsLabel = this.add.text(rightColX, -panelHeight / 2 + 95, 'Attributes', {
      fontFamily: 'Arial Black',
      fontSize: '12px',
      color: '#a5b4fc',
    }).setName('charStatsLabel');

    // Stats container for visual stat bars
    const statsContainer = this.add.container(rightColX, -panelHeight / 2 + 115).setName('charStatsContainer');

    this.characterDetailsContainer.add([
      panelBg,
      artFrame,
      artIcon,
      artSprite,
      loreLabel,
      loreText,
      nameText,
      roleText,
      divider,
      statsLabel,
      statsContainer,
    ]);
    
    // Back button
    const backBtn = this.createBackButton(() => this.showMenu('main'));
    
    this.charactersContainer.add([title, this.characterDetailsContainer, backBtn]);
    
    // Initialize detail panel with the default selected character (no animation on first load)
    this.showCharacterDetails(this.selectedCharacter, false);
  }
  
  private createCharacterPortrait(char: CharacterInfo, x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const size = 70;
    container.setData('charId', char.id);
    container.setData('size', size);
    
    // Portrait frame
    const frame = this.add.graphics().setName('portraitFrame');
    const drawFrame = (selected: boolean) => {
      frame.clear();
      const baseAlpha = selected ? 0.6 : 0.3;
      const lineWidth = selected ? 3 : 2;
      frame.fillStyle(char.unlocked ? char.color : 0x333333, baseAlpha);
      frame.fillRoundedRect(-size / 2, -size / 2, size, size, 10);
      frame.lineStyle(lineWidth, char.unlocked ? char.color : 0x444444, 1);
      frame.strokeRoundedRect(-size / 2, -size / 2, size, size, 10);
    };
    drawFrame(char.id === this.selectedCharacter);
    
    // Character icon - use sprite for wizard, fallback to letter for others
    let icon: Phaser.GameObjects.Image | Phaser.GameObjects.Text;
    if (char.id === 'wizard' && char.unlocked && this.textures.exists('wizard-south')) {
      icon = this.add.image(0, 0, 'wizard-south')
        .setOrigin(0.5)
        .setScale(2.5); // Scale up the 32x32 sprite to fit the portrait (80px)
    } else {
      icon = this.add.text(0, -6, char.unlocked ? char.name[0] : '?', {
        fontFamily: 'Arial Black',
        fontSize: '28px',
        color: char.unlocked ? '#ffffff' : '#444444',
      }).setOrigin(0.5);
    }
    
    // Name below
    const name = this.add.text(0, size / 2 + 10, char.name, {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: char.unlocked ? '#e5e7eb' : '#4b5563',
    }).setOrigin(0.5);
    
    container.add([frame, icon, name]);
    
    // Interactivity
    if (char.unlocked) {
      const hitArea = this.add.rectangle(0, 0, size + 20, size + 30, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
      
      hitArea.on('pointerover', () => {
        container.setScale(1.06);
      });
      
      hitArea.on('pointerout', () => {
        container.setScale(1);
      });
      
      hitArea.on('pointerdown', () => {
        this.playUISound('click');
        this.showCharacterDetails(char.id);
      });
      
      container.add(hitArea);
    }
    
    // Lock icon for locked characters
    if (!char.unlocked) {
      const lock = this.add.text(0, -5, '\ud83d\udd12', {
        fontSize: '16px',
      }).setOrigin(0.5);
      container.add(lock);
    }
    
    return container;
  }

  /**
   * Update the large character detail panel and highlight the selected portrait.
   */
  private showCharacterDetails(charId: string, animate: boolean = true): void {
    const previousId = this.selectedCharacter;
    this.selectedCharacter = charId;
    if (!this.characterDetailsContainer) return;
    const character = this.characterData.find((c) => c.id === charId);
    if (!character) return;

    // Update portrait highlights
    this.characterPortraits.forEach((portrait) => {
      const id = portrait.getData('charId') as string | undefined;
      const size = (portrait.getData('size') as number | undefined) ?? 70;
      const frame = portrait.getByName('portraitFrame') as Phaser.GameObjects.Graphics | null;
      if (!id || !frame) return;

      const data = this.characterData.find((c) => c.id === id);
      const unlocked = data?.unlocked ?? false;
      const color = data?.color ?? 0x333333;
      const selected = id === charId;

      frame.clear();
      const baseAlpha = unlocked ? (selected ? 0.6 : 0.3) : 0.2;
      const lineWidth = unlocked ? (selected ? 3 : 2) : 1;
      frame.fillStyle(color, baseAlpha);
      frame.fillRoundedRect(-size / 2, -size / 2, size, size, 10);
      frame.lineStyle(lineWidth, unlocked ? color : 0x444444, 1);
      frame.strokeRoundedRect(-size / 2, -size / 2, size, size, 10);
    });

    // Detail panel elements
    const artIcon = this.characterDetailsContainer.getByName('charArtIcon') as Phaser.GameObjects.Text | null;
    const artSprite = this.characterDetailsContainer.getByName('charArtSprite') as Phaser.GameObjects.Image | null;
    const nameText = this.characterDetailsContainer.getByName('charName') as Phaser.GameObjects.Text | null;
    const roleText = this.characterDetailsContainer.getByName('charRole') as Phaser.GameObjects.Text | null;
    const loreText = this.characterDetailsContainer.getByName('charLore') as Phaser.GameObjects.Text | null;
    const artFrame = this.characterDetailsContainer.getByName('charArtFrame') as Phaser.GameObjects.Graphics | null;
    const statsContainer = this.characterDetailsContainer.getByName('charStatsContainer') as Phaser.GameObjects.Container | null;

    const applyContent = () => {
      // Show sprite for wizard, text placeholder for others
      const hasSprite = character.id === 'wizard' && this.textures.exists('wizard-south');
      if (artIcon) {
        artIcon.setText(character.name[0]);
        artIcon.setColor('#ffffff');
        artIcon.setVisible(!hasSprite);
      }
      if (artSprite) {
        artSprite.setVisible(hasSprite);
      }

      if (nameText) {
        nameText.setText(character.name);
      }

      if (roleText) {
        roleText.setText(character.description);
      }

      if (loreText) {
        loreText.setText(character.lore);
      }

      // Update art frame with character color
      if (artFrame) {
        const panelWidth = 720;
        const artSize = 140;
        const leftColX = -panelWidth / 2 + 40;
        artFrame.clear();
        artFrame.fillStyle(0x111827, 1);
        artFrame.fillRoundedRect(leftColX, -artSize / 2 - 20, artSize, artSize, 12);
        artFrame.lineStyle(3, character.color, 1);
        artFrame.strokeRoundedRect(leftColX, -artSize / 2 - 20, artSize, artSize, 12);
      }

      // Render stats as visual bars
      if (statsContainer) {
        statsContainer.removeAll(true);
        const barWidth = 100;
        const barHeight = 8;
        let yOffset = 0;

        character.stats.forEach((stat) => {
          // Parse stat line like "Health: ★★★☆☆" or "Difficulty: Normal"
          const [label, value] = stat.split(': ');
          
          // Label text
          const labelText = this.add.text(0, yOffset, label, {
            fontFamily: 'Arial',
            fontSize: '11px',
            color: '#9ca3af',
          });
          statsContainer.add(labelText);

          // Check if it's a star rating or text value
          const starCount = (value.match(/★/g) || []).length;
          const maxStars = 5;
          
          if (starCount > 0) {
            // Render as visual bar
            const barBg = this.add.graphics();
            barBg.fillStyle(0x1f2937, 1);
            barBg.fillRoundedRect(70, yOffset + 2, barWidth, barHeight, 3);
            
            const barFill = this.add.graphics();
            const fillWidth = (starCount / maxStars) * barWidth;
            barFill.fillStyle(character.color, 1);
            barFill.fillRoundedRect(70, yOffset + 2, fillWidth, barHeight, 3);
            
            statsContainer.add([barBg, barFill]);
          } else {
            // Render as text value
            const valueText = this.add.text(70, yOffset, value, {
              fontFamily: 'Arial',
              fontSize: '11px',
              color: '#e5e7eb',
            });
            statsContainer.add(valueText);
          }

          yOffset += 22;
        });
      }
    };

    // Animate panel content when switching characters after initial load
    if (animate && previousId !== charId) {
      this.tweens.add({
        targets: this.characterDetailsContainer,
        alpha: 0,
        duration: 120,
        ease: 'Quad.easeIn',
        onComplete: () => {
          applyContent();
          this.tweens.add({
            targets: this.characterDetailsContainer,
            alpha: 1,
            duration: 180,
            ease: 'Quad.easeOut',
          });
        },
      });
    } else {
      applyContent();
      this.characterDetailsContainer.setAlpha(1);
    }
  }
  
  // ===========================================================================
  // ACHIEVEMENTS MENU
  // ===========================================================================
  
  private createAchievementsMenu(): void {
    this.achievementsContainer = this.add.container(0, 0);
    this.achievementsContainer.setVisible(false);
    
    // Add enhanced background
    this.createAchievementsMenuBackground();
    
    const title = this.createMenuTitle('ACHIEVEMENTS');
    
    // Achievement data (sample)
    const achievements = [
      { id: 'first_kill', name: 'First Blood', description: 'Defeat your first enemy', unlocked: true, icon: '\u2694\ufe0f' },
      { id: 'floor_clear', name: 'Floor Cleared', description: 'Complete a dungeon floor', unlocked: true, icon: '\ud83c\udfc6' },
      { id: 'boss_kill', name: 'Boss Slayer', description: 'Defeat a boss', unlocked: false, icon: '\ud83d\udc51' },
      { id: 'no_damage', name: 'Untouchable', description: 'Clear a floor without damage', unlocked: false, icon: '\u2728' },
      { id: 'speedrun', name: 'Speed Demon', description: 'Clear a dungeon in 10 minutes', unlocked: false, icon: '\u26a1' },
      { id: 'collector', name: 'Spell Collector', description: 'Unlock 10 spells', unlocked: false, icon: '\ud83d\uddc2' },
    ];
    
    // Create achievement list
    const startY = 160;
    const rowHeight = 60;
    
    achievements.forEach((ach, index) => {
      const row = this.createAchievementRow(ach, startY + index * rowHeight);
      this.achievementsContainer.add(row);
    });
    
    // Stats summary
    const unlocked = achievements.filter(a => a.unlocked).length;
    const stats = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, `${unlocked}/${achievements.length} Unlocked`, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#a3a3a3',
    }).setOrigin(0.5);
    
    // Back button
    const backBtn = this.createBackButton(() => this.showMenu('main'));
    
    this.achievementsContainer.add([title, stats, backBtn]);
  }
  
  private createAchievementRow(ach: { id: string; name: string; description: string; unlocked: boolean; icon: string }, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(GAME_WIDTH / 2, y);
    const width = 480;
    const height = 56;
    
    // Background
    const bg = this.add.graphics();
    bg.fillStyle(ach.unlocked ? 0x14532d : 0x111827, ach.unlocked ? 0.6 : 0.6);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 6);
    bg.lineStyle(2, ach.unlocked ? 0x22c55e : 0x374151, 1);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 6);
    
    // Icon
    const icon = this.add.text(-width / 2 + 28, 0, ach.icon, {
      fontSize: '20px',
    }).setOrigin(0.5);
    if (!ach.unlocked) icon.setAlpha(0.3);
    
    // Name
    const name = this.add.text(-width / 2 + 56, -12, ach.name, {
      fontFamily: 'Arial Black',
      fontSize: '16px',
      color: ach.unlocked ? '#ffffff' : '#6b7280',
      wordWrap: { width: width - 180 },
    });
    
    // Description
    const desc = this.add.text(-width / 2 + 56, 8, ach.description, {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: ach.unlocked ? '#e5e7eb' : '#4b5563',
      wordWrap: { width: width - 180 },
    });
    
    // Check mark for unlocked
    if (ach.unlocked) {
      const check = this.add.text(width / 2 - 22, 0, '\u2713', {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#22c55e',
      }).setOrigin(0.5);
      container.add(check);
    }
    
    container.add([bg, icon, name, desc]);
    return container;
  }
  
  // ===========================================================================
  // SETTINGS MENU
  // ===========================================================================
  
  private createSettingsMenu(): void {
    this.settingsContainer = this.add.container(0, 0);
    this.settingsContainer.setVisible(false);
    
    // Add enhanced background
    this.createSettingsMenuBackground();
    
    const title = this.createMenuTitle('SETTINGS');
    
    // Settings options
    const startY = 150;
    const spacing = 70;
    
    // Master Volume
    const masterSlider = this.createSlider('Master Volume', startY, this.masterVolume, (value) => {
      this.masterVolume = value;
      // Update global volume
      this.sound.volume = value;
    });
    
    // Music Volume
    const musicSlider = this.createSlider('Music Volume', startY + spacing, this.musicVolume, (value) => {
      this.musicVolume = value;
      // Update active music volume
      const music = this.sound.get('music_menu');
      if (music && music.isPlaying) {
        (music as Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound).setVolume(value * this.masterVolume);
      }
    });
    
    // SFX Volume
    const sfxSlider = this.createSlider('Sound Effects', startY + spacing * 2, this.sfxVolume, (value) => {
      this.sfxVolume = value;
    });
    
    // Screen Shake toggle
    const shakeToggle = this.createToggle('Screen Shake', startY + spacing * 3, true);
    
    // Damage Numbers toggle
    const damageToggle = this.createToggle('Damage Numbers', startY + spacing * 4, true);
    
    // Back button
    const backBtn = this.createBackButton(() => this.showMenu('main'));
    
    this.settingsContainer.add([title, masterSlider, musicSlider, sfxSlider, shakeToggle, damageToggle, backBtn]);
  }
  
  private createSlider(label: string, y: number, value: number, callback: (value: number) => void): Phaser.GameObjects.Container {
    const container = this.add.container(GAME_WIDTH / 2 - 50, y);
    const sliderWidth = 240;
    const trackHeight = 16;
    const knobSize = 12;
    
    // Label with glow
    const text = this.add.text(-200, 0, label, {
      fontFamily: 'Arial Black',
      fontSize: '18px',
      color: '#a855f7',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0, 0.5);
    
    // Slider track background with tick marks
    const track = this.add.graphics();
    track.fillStyle(0x0f0f1a, 1);
    track.fillRoundedRect(40, -trackHeight/2, sliderWidth, trackHeight, 4);
    track.lineStyle(2, 0x333333, 1);
    track.strokeRoundedRect(40, -trackHeight/2, sliderWidth, trackHeight, 4);
    
    // Add tick marks
    track.lineStyle(1, 0x444444, 0.5);
    for (let i = 1; i < 10; i++) {
      const tickX = 40 + (sliderWidth * i / 10);
      track.lineBetween(tickX, -trackHeight/2 + 2, tickX, trackHeight/2 - 2);
    }
    
    // Slider fill (energy beam style)
    const fill = this.add.graphics();
    fill.fillStyle(0x8b5cf6, 1); // Lighter purple
    fill.fillRoundedRect(40, -trackHeight/2 + 2, sliderWidth * value, trackHeight - 4, 2);
    
    // Slider handle (diamond shape)
    const handleX = 40 + sliderWidth * value;
    const handle = this.add.graphics();
    
    const drawHandle = () => {
      handle.clear();
      // Diamond shape
      handle.fillStyle(0xffffff, 1);
      handle.beginPath();
      handle.moveTo(0, -knobSize);
      handle.lineTo(knobSize, 0);
      handle.lineTo(0, knobSize);
      handle.lineTo(-knobSize, 0);
      handle.closePath();
      handle.fillPath();
      
      // Inner purple diamond
      handle.fillStyle(0x6366f1, 1);
      handle.beginPath();
      handle.moveTo(0, -knobSize/2);
      handle.lineTo(knobSize/2, 0);
      handle.lineTo(0, knobSize/2);
      handle.lineTo(-knobSize/2, 0);
      handle.closePath();
      handle.fillPath();
      
      // Glow border
      handle.lineStyle(2, 0xa855f7, 0.8);
      handle.strokePath();
    };
    drawHandle();
    handle.x = handleX;
    
    // Value text
    const valueText = this.add.text(sliderWidth + 60, 0, `${Math.round(value * 100)}%`, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#e2e8f0',
    }).setOrigin(0, 0.5);
    
    // Make interactive - click or drag to adjust
    const hitArea = this.add.rectangle(40 + sliderWidth / 2, 0, sliderWidth + 40, 40, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    
    hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.activeSlider = { container, fill, handle: handle as any, valueText, sliderWidth, callback };
      this.updateActiveSlider(pointer);
    });
    
    // Hover effect
    hitArea.on('pointerover', () => {
      text.setColor('#ffffff');
      handle.setScale(1.2);
    });
    hitArea.on('pointerout', () => {
      text.setColor('#a855f7');
      handle.setScale(1);
    });
    
    container.add([text, track, fill, handle, valueText, hitArea]);
    return container;
  }
  
  private createToggle(label: string, y: number, value: boolean): Phaser.GameObjects.Container {
    const container = this.add.container(GAME_WIDTH / 2 - 50, y);
    
    // Label
    const text = this.add.text(-200, 0, label, {
      fontFamily: 'Arial Black',
      fontSize: '18px',
      color: '#a855f7',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0, 0.5);
    
    // Toggle background
    const bg = this.add.graphics();
    const drawToggle = (on: boolean) => {
      bg.clear();
      
      // Track (Runestone base)
      bg.fillStyle(on ? 0x2e1065 : 0x1a1a1a, 1);
      bg.lineStyle(2, on ? 0xa855f7 : 0x444444, 1);
      bg.fillRoundedRect(200, -15, 72, 30, 4); // Less rounded, more stone-like
      bg.strokeRoundedRect(200, -15, 72, 30, 4);
      
      // Knob (Magic crystal)
      const knobX = on ? 256 : 216;
      bg.fillStyle(on ? 0xd8b4fe : 0x4b5563, 1);
      
      // Diamond crystal shape
      bg.beginPath();
      bg.moveTo(knobX, -10);
      bg.lineTo(knobX + 10, 0);
      bg.lineTo(knobX, 10);
      bg.lineTo(knobX - 10, 0);
      bg.closePath();
      bg.fillPath();
      
      // Glow effect if on
      if (on) {
        bg.lineStyle(2, 0xffffff, 0.8);
        bg.strokePath();
        
        // Outer glow
        bg.lineStyle(4, 0xa855f7, 0.3);
        bg.strokeRoundedRect(200, -15, 72, 30, 4);
      }
    };
    drawToggle(value);
    
    // Hit area
    const hitArea = this.add.rectangle(236, 0, 72, 30, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    
    let isOn = value;
    hitArea.on('pointerdown', () => {
      isOn = !isOn;
      drawToggle(isOn);
      this.playUISound('click');
    });
    
    // Hover effect
    hitArea.on('pointerover', () => {
      text.setColor('#ffffff');
    });
    hitArea.on('pointerout', () => {
      text.setColor('#a855f7');
    });
    
    container.add([text, bg, hitArea]);
    return container;
  }
  
  /**
   * Setup global drag handling for sliders.
   */
  private setupSliderDragHandling(): void {
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.activeSlider) {
        this.updateActiveSlider(pointer);
      }
    });
    
    this.input.on('pointerup', () => {
      this.activeSlider = null;
    });
  }
  
  /**
   * Update the active slider based on pointer position.
   */
  private updateActiveSlider(pointer: Phaser.Input.Pointer): void {
    if (!this.activeSlider) return;
    
    const { container, fill, handle, valueText, sliderWidth } = this.activeSlider;
    const trackHeight = 16;
    // Use worldX for proper coordinate conversion with scaled canvas
    const localX = pointer.worldX - container.x;
    const newValue = Phaser.Math.Clamp((localX - 40) / sliderWidth, 0, 1);
    
    // Trigger callback with new value
    if (this.activeSlider.callback) {
      this.activeSlider.callback(newValue);
    }
    
    fill.clear();
    fill.fillStyle(0x6366f1, 1);
    fill.fillRoundedRect(40, -trackHeight/2, sliderWidth * newValue, trackHeight, trackHeight/2);
    handle.x = 40 + sliderWidth * newValue;
    valueText.setText(`${Math.round(newValue * 100)}%`);
  }
  
  // ===========================================================================
  // HELPERS
  // ===========================================================================
  
  private createMenuTitle(text: string): Phaser.GameObjects.Text {
    return this.add.text(GAME_WIDTH / 2, 45, text, {
      fontFamily: 'Arial Black, Arial',
      fontSize: '32px',
      color: '#ffffff',
      stroke: '#6366f1',
      strokeThickness: 3,
      shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, fill: true }
    }).setOrigin(0.5);
  }
  
  private createStyledButton(
    x: number,
    y: number,
    text: string,
    color: number,
    callback: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const width = 280;
    const height = 50;
    
    // Button background
    const bg = this.add.graphics();
    const drawButton = (hover: boolean) => {
      bg.clear();
      bg.fillStyle(color, hover ? 0.8 : 0.4);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
      bg.lineStyle(hover ? 3 : 2, color, 1);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 8);
    };
    drawButton(false);
    
    // Button text
    const label = this.add.text(0, 0, text, {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    
    // Hit area
    const hitArea = this.add.rectangle(0, 0, width, height, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    
    hitArea.on('pointerover', () => {
      drawButton(true);
      label.setScale(1.05);
      this.playUISound('hover');
    });
    
    hitArea.on('pointerout', () => {
      drawButton(false);
      label.setScale(1);
    });
    
    hitArea.on('pointerdown', () => {
      this.playUISound('click');
      this.tweens.add({
        targets: container,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 50,
        yoyo: true,
        onComplete: callback,
      });
    });
    
    container.add([bg, label, hitArea]);
    return container;
  }
  
  private createBackButton(callback: () => void): Phaser.GameObjects.Container {
    const container = this.add.container(100, GAME_HEIGHT - 40);
    const width = 120;
    const height = 40;
    
    const bg = this.add.graphics();
    const drawButton = (hover: boolean) => {
      bg.clear();
      bg.fillStyle(0x1a0a2e, 0.9);
      bg.lineStyle(2, hover ? 0xffffff : 0x6366f1, 1);
      bg.fillRoundedRect(-width/2, -height/2, width, height, 8);
      bg.strokeRoundedRect(-width/2, -height/2, width, height, 8);
    };
    drawButton(false);
    
    const text = this.add.text(0, 0, '← BACK', {
      fontFamily: 'Arial Black',
      fontSize: '18px',
      color: '#6366f1',
    }).setOrigin(0.5);
    
    const hitArea = this.add.rectangle(0, 0, width, height, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    
    hitArea.on('pointerover', () => {
      drawButton(true);
      text.setColor('#ffffff');
      text.setScale(1.1);
      this.playUISound('hover');
    });
    
    hitArea.on('pointerout', () => {
      drawButton(false);
      text.setColor('#6366f1');
      text.setScale(1);
    });
    
    hitArea.on('pointerdown', () => {
      this.playUISound('back');
      this.tweens.add({
        targets: container,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 50,
        yoyo: true,
        onComplete: callback,
      });
    });
    
    container.add([bg, text, hitArea]);
    return container;
  }
  
  /**
   * Create arc-based dungeon carousel with drag scrolling
   */
  private createCircularDungeonHub(dungeons: DungeonInfo[]): void {
    const arcCenterX = GAME_WIDTH / 2;
    const arcCenterY = 420; // Arc center positioned to create rainbow effect at top
    const arcRadius = 250;
    
    // Store carousel state
    this.carouselOffset = 0;
    
    // Create arc path visualization
    const arcPath = this.add.graphics();
    arcPath.lineStyle(2, 0x4f46e5, 0.2);
    arcPath.beginPath();
    // Arc from -PI/2 - 0.4*PI to -PI/2 + 0.4*PI (centered at top)
    arcPath.arc(arcCenterX, arcCenterY, arcRadius, Math.PI * 1.1, Math.PI * 1.9, false);
    arcPath.strokePath();
    this.dungeonsContainer.add(arcPath);
    
    // Create carousel container (not rotating - we'll move nodes individually)
    const carouselContainer = this.add.container(0, 0);
    carouselContainer.setName('carouselContainer');
    
    // Create dungeon nodes along the arc
    dungeons.forEach((dungeon, index) => {
      const node = this.createArcDungeonNode(dungeon, index);
      this.dungeonPortraits.push(node);
      carouselContainer.add(node);
    });
    
    this.dungeonsContainer.add(carouselContainer);
    
    // Setup drag interaction
    this.setupCarouselDrag(arcCenterX, arcCenterY, arcRadius, dungeons.length);
    
    // Initial position update
    this.updateCarouselPositions(arcCenterX, arcCenterY, arcRadius, dungeons.length);
  }
  
  /**
   * Create a dungeon node for the arc carousel (always upright)
   */
  private createArcDungeonNode(dungeon: DungeonInfo, index: number): Phaser.GameObjects.Container {
    const container = this.add.container(0, 0);
    container.setData('dungeonId', dungeon.id);
    container.setData('index', index);
    
    const nodeSize = 70;
    const isSelected = dungeon.id === this.selectedDungeon;
    
    // Outer glow effect
    const glow = this.add.graphics().setName('glow');
    if (dungeon.unlocked) {
      glow.fillStyle(dungeon.color, 0.3);
      glow.fillCircle(0, 0, nodeSize / 2 + 12);
    }
    
    // Main node circle
    const nodeBg = this.add.graphics().setName('nodeBg');
    this.drawArcNode(nodeBg, dungeon, nodeSize, isSelected, false);
    
    // Dungeon icon
    const icons: Record<string, string> = {
      depths: '🏰',
      crypt: '💀',
      volcano: '🔥',
      frost: '❄️'
    };
    
    const icon = this.add.text(0, -5, dungeon.unlocked ? (icons[dungeon.id] || '?') : '🔒', {
      fontSize: '28px',
    }).setOrigin(0.5).setName('icon');
    
    // Dungeon name below node (always upright)
    const name = this.add.text(0, nodeSize / 2 + 12, dungeon.name, {
      fontFamily: 'Arial Black',
      fontSize: '11px',
      color: dungeon.unlocked ? '#ffffff' : '#666666',
    }).setOrigin(0.5).setName('name');
    
    // Floor count
    const floors = this.add.text(0, nodeSize / 2 + 26, `${dungeon.floors} Floors`, {
      fontFamily: 'Arial',
      fontSize: '9px',
      color: dungeon.unlocked ? '#9ca3af' : '#4b5563',
    }).setOrigin(0.5).setName('floors');
    
    container.add([glow, nodeBg, icon, name, floors]);
    
    // Interactivity
    if (dungeon.unlocked) {
      const hitArea = this.add.circle(0, 0, nodeSize / 2 + 15, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
      
      // Set high depth to ensure it's above the drag zone
      hitArea.setDepth(200);
      
      hitArea.on('pointerover', () => {
        this.hoveredDungeonId = dungeon.id;
        if (dungeon.id !== this.selectedDungeon) {
          this.drawArcNode(nodeBg, dungeon, nodeSize, false, true);
          this.playUISound('hover');
        }
      });
      
      hitArea.on('pointerout', () => {
        this.hoveredDungeonId = null;
        this.drawArcNode(nodeBg, dungeon, nodeSize, dungeon.id === this.selectedDungeon, false);
      });
      
      hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        // Stop propagation to prevent drag zone from catching this
        pointer.event.stopPropagation();
        this.hoveredDungeonId = null; // Clear hover state
        this.playUISound('click');
        this.scrollToCarouselIndex(container.getData('index') as number);
      });
      
      container.add(hitArea);
    }
    
    return container;
  }
  
  /**
   * Draw arc node graphics
   */
  private drawArcNode(graphics: Phaser.GameObjects.Graphics, dungeon: DungeonInfo, nodeSize: number, selected: boolean, hover: boolean): void {
    graphics.clear();
    const alpha = selected ? 1 : (hover ? 0.85 : 0.7);
    const scale = selected ? 1.15 : (hover ? 1.08 : 1);
    const actualSize = (nodeSize / 2) * scale;
    
    if (dungeon.unlocked) {
      graphics.fillStyle(dungeon.color, alpha);
      graphics.fillCircle(0, 0, actualSize);
      graphics.lineStyle(selected ? 4 : 2, 0xffffff, selected ? 0.9 : 0.5);
    } else {
      graphics.fillStyle(0x333333, alpha);
      graphics.fillCircle(0, 0, actualSize);
      graphics.lineStyle(2, 0x666666, 0.4);
    }
    graphics.strokeCircle(0, 0, actualSize);
  }
  
  /**
   * Setup carousel drag interaction
   */
  private setupCarouselDrag(centerX: number, centerY: number, radius: number, count: number): void {
    // Create invisible drag zone covering the arc area (lower depth than nodes)
    const dragZone = this.add.rectangle(centerX, centerY - radius + 50, GAME_WIDTH - 100, 200, 0x000000, 0)
      .setInteractive({ draggable: true })
      .setDepth(50); // Lower depth than dungeon nodes
    
    let startX = 0;
    let startOffset = 0;
    
    dragZone.on('dragstart', (pointer: Phaser.Input.Pointer) => {
      this.hoveredDungeonId = null; // Clear hover state when dragging starts
      startX = pointer.x;
      startOffset = this.carouselOffset;
    });
    
    dragZone.on('drag', (pointer: Phaser.Input.Pointer) => {
      const deltaX = pointer.x - startX;
      // Convert pixel drag to carousel offset (higher sensitivity for better control)
      this.carouselOffset = startOffset - deltaX * 0.008;
      this.updateCarouselPositions(centerX, centerY, radius, count);
    });
    
    dragZone.on('dragend', (_pointer: Phaser.Input.Pointer) => {
      // Stop any momentum and snap immediately to nearest dungeon
      this.snapToNearestDungeon(count);
    });
    
    this.dungeonsContainer.add(dragZone);
  }
  
  /**
   * Update positions of all carousel nodes
   */
  private updateCarouselPositions(centerX: number, centerY: number, radius: number, count: number): void {
    const arcSpan = Math.PI * 0.8; // Arc spans about 144 degrees
    const spacing = arcSpan / Math.max(count - 1, 1); // Space between each dungeon
    
    this.dungeonPortraits.forEach((node, index) => {
      // Calculate how far this node is from the current carousel position
      let offset = index - this.carouselOffset;
      
      // Wrap around for infinite scrolling
      while (offset > count / 2) offset -= count;
      while (offset < -count / 2) offset += count;
      
      // Position along arc - offset 0 means top center
      const angleOffset = offset * spacing;
      const angle = -Math.PI / 2 + angleOffset; // -PI/2 is top center
      
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      node.setPosition(x, y);
      
      // Scale based on distance from center (center = largest)
      const distanceFromCenter = Math.abs(offset);
      const scale = 1.1 - distanceFromCenter * 0.2;
      node.setScale(Math.max(0.6, Math.min(1.1, scale)));
      
      // Alpha based on distance from center
      const alpha = 1 - distanceFromCenter * 0.25;
      node.setAlpha(Math.max(0.4, alpha));
      
      // Depth sorting - center items on top (base depth above drag zone)
      node.setDepth(150 - Math.abs(offset) * 10);
      
      // Update selection visual if this is the centered dungeon
      const isCentered = Math.abs(offset) < 0.4;
      const dungeonId = node.getData('dungeonId') as string;
      const dungeon = this.dungeonData.find(d => d.id === dungeonId);
      const nodeBg = node.getByName('nodeBg') as Phaser.GameObjects.Graphics;
      
      if (dungeon && nodeBg) {
        // Check if this dungeon is hovered
        const isHovered = this.hoveredDungeonId === dungeon.id;
        this.drawArcNode(nodeBg, dungeon, 70, isCentered, isHovered);
      }
      
      // Update selected dungeon when centered
      if (isCentered && dungeonId !== this.selectedDungeon) {
        this.selectedDungeon = dungeonId;
        this.updateDungeonDetailsPanel();
      }
    });
  }
  
  /**
   * Snap carousel to nearest dungeon
   */
  private snapToNearestDungeon(_count: number): void {
    const nearestIndex = Math.round(this.carouselOffset);
    this.scrollToCarouselIndex(nearestIndex);
  }
  
  /**
   * Scroll carousel to specific index with animation
   */
  private scrollToCarouselIndex(targetIndex: number): void {
    const arcCenterX = GAME_WIDTH / 2;
    const arcCenterY = 420;
    const arcRadius = 250;
    const count = this.dungeonData.length;
    
    // Animate to target
    this.tweens.add({
      targets: this,
      carouselOffset: targetIndex,
      duration: 400,
      ease: 'Cubic.easeOut',
      onUpdate: () => {
        this.updateCarouselPositions(arcCenterX, arcCenterY, arcRadius, count);
      },
      onComplete: () => {
        // Update selection
        const targetDungeon = this.dungeonData[((targetIndex % count) + count) % count];
        if (targetDungeon) {
          this.selectedDungeon = targetDungeon.id;
          this.showDungeonDetails(targetDungeon.id, true);
        }
      }
    });
  }
  
  /**
   * Update dungeon details panel without animation
   */
  private updateDungeonDetailsPanel(): void {
    if (!this.dungeonDetailsContainer) return;
    const dungeon = this.dungeonData.find(d => d.id === this.selectedDungeon);
    if (!dungeon) return;
    
    const nameText = this.dungeonDetailsContainer.getByName('dungeonName') as Phaser.GameObjects.Text;
    const loreText = this.dungeonDetailsContainer.getByName('dungeonLore') as Phaser.GameObjects.Text;
    
    if (nameText) nameText.setText(dungeon.name);
    if (loreText) loreText.setText(dungeon.lore);
  }
  
  /**
   * Create central detail display with custom stone tablet design
   */
  private createCentralDetailDisplay(): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = 500; // Better spacing from arc above
    
    this.dungeonDetailsContainer = this.add.container(centerX, centerY);
    
    const panelWidth = 620;
    const panelHeight = 160;
    const cornerRadius = 8;
    
    // Main stone tablet background with gradient effect
    const tablet = this.add.graphics();
    
    // Outer shadow layer
    tablet.fillStyle(0x000000, 0.6);
    tablet.fillRoundedRect(-panelWidth/2 + 4, -panelHeight/2 + 4, panelWidth, panelHeight, cornerRadius);
    
    // Main tablet surface with stone texture gradient
    tablet.fillStyle(0x1a1a2e, 0.95);
    tablet.fillRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, cornerRadius);
    
    // Inner border highlight
    tablet.lineStyle(2, 0x374151, 0.8);
    tablet.strokeRoundedRect(-panelWidth/2 + 2, -panelHeight/2 + 2, panelWidth - 4, panelHeight - 4, cornerRadius - 1);
    
    // Outer ornate border
    tablet.lineStyle(1, 0x6b7280, 0.6);
    tablet.strokeRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, cornerRadius);
    
    // Decorative corner ornaments
    this.drawCornerOrnament(tablet, -panelWidth/2 + 15, -panelHeight/2 + 15, 0x4f46e5);
    this.drawCornerOrnament(tablet, panelWidth/2 - 15, -panelHeight/2 + 15, 0x4f46e5);
    this.drawCornerOrnament(tablet, -panelWidth/2 + 15, panelHeight/2 - 15, 0x4f46e5);
    this.drawCornerOrnament(tablet, panelWidth/2 - 15, panelHeight/2 - 15, 0x4f46e5);
    
    // Top decorative line
    tablet.lineStyle(1, 0x4f46e5, 0.4);
    tablet.beginPath();
    tablet.moveTo(-panelWidth/2 + 40, -panelHeight/2 + 35);
    tablet.lineTo(panelWidth/2 - 40, -panelHeight/2 + 35);
    tablet.strokePath();
    
    // Bottom decorative line
    tablet.beginPath();
    tablet.moveTo(-panelWidth/2 + 40, panelHeight/2 - 35);
    tablet.lineTo(panelWidth/2 - 40, panelHeight/2 - 35);
    tablet.strokePath();
    
    // Dungeon name with custom styling
    const nameText = this.add.text(0, -panelHeight/2 + 25, 'The Depths', {
      fontFamily: 'Arial Black',
      fontSize: '22px',
      color: '#f3f4f6',
      fontStyle: 'bold',
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#000000',
        blur: 3,
        stroke: true,
        fill: true
      }
    }).setOrigin(0.5).setName('dungeonName');
    
    // Lore text with better styling
    const loreText = this.add.text(0, 5, 'Dungeon lore...', {
      fontFamily: 'Georgia',
      fontSize: '13px',
      color: '#d1d5db',
      fontStyle: 'italic',
      wordWrap: { width: panelWidth - 60 },
      lineSpacing: 4,
      align: 'center',
      shadow: {
        offsetX: 1,
        offsetY: 1,
        color: '#000000',
        blur: 2,
        stroke: false,
        fill: true
      }
    }).setOrigin(0.5).setName('dungeonLore');
    
    // Stats container with custom styling
    const statsContainer = this.add.container(0, 45).setName('dungeonStatsContainer');
    
    // Add magical glow effect around the tablet
    const glow = this.add.graphics();
    glow.lineStyle(3, 0x4f46e5, 0.2);
    glow.strokeRoundedRect(-panelWidth/2 - 2, -panelHeight/2 - 2, panelWidth + 4, panelHeight + 4, cornerRadius + 2);
    
    this.dungeonDetailsContainer.add([glow, tablet, nameText, loreText, statsContainer]);
    this.dungeonsContainer.add(this.dungeonDetailsContainer);
  }
  
  /**
   * Draw decorative corner ornament for the tablet
   */
  private drawCornerOrnament(graphics: Phaser.GameObjects.Graphics, x: number, y: number, color: number): void {
    graphics.fillStyle(color, 0.6);
    graphics.lineStyle(1, color, 0.8);
    
    // Draw a small decorative rune/symbol
    graphics.beginPath();
    graphics.moveTo(x - 8, y);
    graphics.lineTo(x, y - 8);
    graphics.lineTo(x + 8, y);
    graphics.lineTo(x, y + 8);
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
    
    // Add inner detail
    graphics.fillStyle(color, 0.8);
    graphics.fillCircle(x, y, 2);
  }
  
  /**
   * Create floating action buttons
   */
  private createFloatingActions(): void {
    const centerX = GAME_WIDTH / 2;
    const bottomY = 620; // Position below detail panel
    
    // Start button with enhanced design
    const startBtn = this.createFloatingButton(centerX, bottomY, 'BEGIN QUEST', 0x22c55e, () => {
      this.playUISound('click');
      this.startGame(false);
    });
    startBtn.setName('startButton');
    
    this.dungeonsContainer.add(startBtn);
  }
  
  /**
   * Create floating button with glass effect
   */
  private createFloatingButton(x: number, y: number, text: string, color: number, callback: () => void): Phaser.GameObjects.Container {
    const btn = this.add.container(x, y);
    const width = 180;
    const height = 45;
    
    // Glass-morphism background
    const bg = this.add.graphics();
    bg.fillStyle(color, 0.8);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
    bg.lineStyle(1, 0xffffff, 0.3);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);
    
    // Button text
    const textObj = this.add.text(0, 0, text, {
      fontFamily: 'Arial Black',
      fontSize: '16px',
      color: '#ffffff',
    }).setOrigin(0.5);
    
    // Hover effect
    const hitArea = this.add.rectangle(0, 0, width, height, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    
    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
      bg.lineStyle(2, 0xffffff, 0.5);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);
      
      this.tweens.add({
        targets: btn,
        scale: 1.05,
        duration: 150,
        ease: 'Quad.easeOut'
      });
    });
    
    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(color, 0.8);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
      bg.lineStyle(1, 0xffffff, 0.3);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);
      
      this.tweens.add({
        targets: btn,
        scale: 1,
        duration: 150,
        ease: 'Quad.easeOut'
      });
    });
    
    hitArea.on('pointerdown', callback);
    
    btn.add([bg, textObj, hitArea]);
    
    // Floating animation
    this.tweens.add({
      targets: btn,
      y: y - 5,
      duration: 2000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
    
    return btn;
  }
  
  private showMenu(state: MenuState): void {
    // Hide all menus
    this.mainContainer.setVisible(false);
    this.playContainer.setVisible(false);
    this.dungeonsContainer.setVisible(false);
    this.charactersContainer.setVisible(false);
    this.achievementsContainer.setVisible(false);
    this.settingsContainer.setVisible(false);
    
    // Show requested menu with animation
    const containers: Record<MenuState, Phaser.GameObjects.Container> = {
      main: this.mainContainer,
      play: this.playContainer,
      dungeons: this.dungeonsContainer,
      characters: this.charactersContainer,
      achievements: this.achievementsContainer,
      settings: this.settingsContainer,
    };
    
    const container = containers[state];
    container.setVisible(true);
    container.setAlpha(0);
    
    this.tweens.add({
      targets: container,
      alpha: 1,
      duration: 200,
      ease: 'Power2',
    });
    
    // Note: currentState assignment removed as property is unused
    // this.currentState = state;
  }
  
  private startGame(continueRun: boolean): void {
    // Play start sound and fade out
    this.playUISound('start');
    this.cameras.main.fadeOut(500, 0, 0, 0);
    
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(SCENES.GAME, {
        continueRun,
        character: this.selectedCharacter,
        dungeon: this.selectedDungeon,
      });
    });
  }
}
