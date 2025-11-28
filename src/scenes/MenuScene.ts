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
}

/** Dungeon data */
interface DungeonInfo {
  id: string;
  name: string;
  description: string;
  floors: number;
  color: number;
  unlocked: boolean;
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
  
  // Current state
  private currentState: MenuState = 'main';
  
  // Background particles
  private particles: Phaser.GameObjects.Graphics[] = [];
  
  // Selected options
  private selectedCharacter: string = 'wizard';
  private selectedDungeon: string = 'depths';
  
  // Animation tweens
  private titleTween?: Phaser.Tweens.Tween;
  
  constructor() {
    super(SCENES.MENU);
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
    
    // Show main menu
    this.showMenu('main');
    
    // Play menu music (if loaded)
    this.playMenuMusic();
  }
  
  /**
   * Play menu background music.
   */
  private playMenuMusic(): void {
    // Check if music is loaded
    if (this.sound.get('music_menu')) {
      // Already playing? Don't restart
      return;
    }
    
    // Try to play menu music
    if (this.cache.audio.exists('music_menu')) {
      this.sound.play('music_menu', {
        loop: true,
        volume: 0.5,
      });
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
    // Gradient background
    const graphics = this.add.graphics();
    
    // Dark purple to black gradient
    const colors = [0x1a0a2e, 0x16213e, 0x0f0f23];
    const height = GAME_HEIGHT / colors.length;
    
    colors.forEach((color, i) => {
      graphics.fillStyle(color, 1);
      graphics.fillRect(0, i * height, GAME_WIDTH, height + 1);
    });
    
    // Add some decorative elements
    graphics.lineStyle(1, 0x6366f1, 0.1);
    for (let i = 0; i < 20; i++) {
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      graphics.lineBetween(0, y, GAME_WIDTH, y);
    }
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
    
    // Animated title
    const title = this.add.text(GAME_WIDTH / 2, 50, 'ARCANE DEPTHS', {
      fontFamily: 'Arial Black, Arial',
      fontSize: '28px',
      color: '#ffffff',
      stroke: '#6366f1',
      strokeThickness: 2,
    }).setOrigin(0.5);
    
    // Title glow effect
    this.titleTween = this.tweens.add({
      targets: title,
      alpha: { from: 0.8, to: 1 },
      scaleX: { from: 1, to: 1.02 },
      scaleY: { from: 1, to: 1.02 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    
    // Subtitle
    const subtitle = this.add.text(GAME_WIDTH / 2, 80, 'A Magic Roguelike Adventure', {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: '#a855f7',
    }).setOrigin(0.5);
    
    // Menu buttons
    const buttonY = 120;
    const spacing = 28;
    
    const playBtn = this.createStyledButton(GAME_WIDTH / 2, buttonY, 'PLAY', 0x6366f1, () => {
      this.showMenu('play');
    });
    
    const dungeonsBtn = this.createStyledButton(GAME_WIDTH / 2, buttonY + spacing, 'DUNGEONS', 0x8b5cf6, () => {
      this.showMenu('dungeons');
    });
    
    const charactersBtn = this.createStyledButton(GAME_WIDTH / 2, buttonY + spacing * 2, 'CHARACTERS', 0xa855f7, () => {
      this.showMenu('characters');
    });
    
    const achievementsBtn = this.createStyledButton(GAME_WIDTH / 2, buttonY + spacing * 3, 'ACHIEVEMENTS', 0x7c3aed, () => {
      this.showMenu('achievements');
    });
    
    const settingsBtn = this.createStyledButton(GAME_WIDTH / 2, buttonY + spacing * 4, 'SETTINGS', 0x5b21b6, () => {
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
  
  // ===========================================================================
  // PLAY MENU (Start Game)
  // ===========================================================================
  
  private createPlayMenu(): void {
    this.playContainer = this.add.container(0, 0);
    this.playContainer.setVisible(false);
    
    const title = this.createMenuTitle('BEGIN YOUR JOURNEY');
    
    // Show selected character and dungeon
    const infoY = 80;
    
    const charLabel = this.add.text(GAME_WIDTH / 2, infoY, 'Character: Wizard', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#a855f7',
    }).setOrigin(0.5).setName('charLabel');
    
    const dungeonLabel = this.add.text(GAME_WIDTH / 2, infoY + 18, 'Dungeon: The Depths', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#6366f1',
    }).setOrigin(0.5).setName('dungeonLabel');
    
    // Continue button (if run in progress)
    const saves = SaveManager.getInstance();
    const continueY = 130;
    
    if (saves.hasRunInProgress()) {
      const continueBtn = this.createStyledButton(GAME_WIDTH / 2, continueY, 'CONTINUE RUN', 0x22c55e, () => {
        this.startGame(true);
      });
      this.playContainer.add(continueBtn);
    }
    
    // New run button
    const newGameBtn = this.createStyledButton(
      GAME_WIDTH / 2, 
      saves.hasRunInProgress() ? continueY + 30 : continueY, 
      'NEW RUN', 
      0x6366f1, 
      () => {
        this.startGame(false);
      }
    );
    
    // Back button
    const backBtn = this.createBackButton(() => this.showMenu('main'));
    
    this.playContainer.add([title, charLabel, dungeonLabel, newGameBtn, backBtn]);
  }
  
  // ===========================================================================
  // DUNGEONS MENU
  // ===========================================================================
  
  private createDungeonsMenu(): void {
    this.dungeonsContainer = this.add.container(0, 0);
    this.dungeonsContainer.setVisible(false);
    
    const title = this.createMenuTitle('SELECT DUNGEON');
    
    // Dungeon data
    const dungeons: DungeonInfo[] = [
      { id: 'depths', name: 'The Depths', description: 'A dark underground labyrinth', floors: 5, color: 0x6366f1, unlocked: true },
      { id: 'crypt', name: 'Cursed Crypt', description: 'Ancient tombs of the undead', floors: 5, color: 0x64748b, unlocked: true },
      { id: 'volcano', name: 'Molten Core', description: 'Rivers of fire and flame', floors: 6, color: 0xef4444, unlocked: false },
      { id: 'frost', name: 'Frozen Abyss', description: 'Eternal ice and darkness', floors: 6, color: 0x3b82f6, unlocked: false },
    ];
    
    // Create dungeon cards
    const startY = 70;
    const cardHeight = 40;
    
    dungeons.forEach((dungeon, index) => {
      const card = this.createDungeonCard(dungeon, startY + index * (cardHeight + 8));
      this.dungeonsContainer.add(card);
    });
    
    // Back button
    const backBtn = this.createBackButton(() => this.showMenu('main'));
    
    this.dungeonsContainer.add([title, backBtn]);
  }
  
  private createDungeonCard(dungeon: DungeonInfo, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(GAME_WIDTH / 2, y);
    const width = 200;
    const height = 36;
    
    // Card background
    const bg = this.add.graphics();
    bg.fillStyle(dungeon.unlocked ? dungeon.color : 0x333333, dungeon.unlocked ? 0.3 : 0.2);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 4);
    bg.lineStyle(1, dungeon.unlocked ? dungeon.color : 0x444444, 0.8);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 4);
    
    // Name
    const name = this.add.text(-width / 2 + 10, -8, dungeon.name, {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: dungeon.unlocked ? '#ffffff' : '#666666',
    });
    
    // Description
    const desc = this.add.text(-width / 2 + 10, 4, dungeon.unlocked ? dungeon.description : '??? Locked ???', {
      fontFamily: 'Arial',
      fontSize: '8px',
      color: dungeon.unlocked ? '#aaaaaa' : '#444444',
    });
    
    // Floors indicator
    const floors = this.add.text(width / 2 - 10, 0, `${dungeon.floors}F`, {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: dungeon.unlocked ? dungeon.color.toString(16).padStart(6, '0') : '#444444',
    }).setOrigin(1, 0.5);
    
    container.add([bg, name, desc, floors]);
    
    // Interactivity
    if (dungeon.unlocked) {
      const hitArea = this.add.rectangle(0, 0, width, height, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
      
      hitArea.on('pointerover', () => {
        bg.clear();
        bg.fillStyle(dungeon.color, 0.5);
        bg.fillRoundedRect(-width / 2, -height / 2, width, height, 4);
        bg.lineStyle(2, dungeon.color, 1);
        bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 4);
      });
      
      hitArea.on('pointerout', () => {
        bg.clear();
        bg.fillStyle(dungeon.color, 0.3);
        bg.fillRoundedRect(-width / 2, -height / 2, width, height, 4);
        bg.lineStyle(1, dungeon.color, 0.8);
        bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 4);
      });
      
      hitArea.on('pointerdown', () => {
        this.selectedDungeon = dungeon.id;
        this.showMenu('play');
      });
      
      container.add(hitArea);
    }
    
    return container;
  }
  
  // ===========================================================================
  // CHARACTERS MENU
  // ===========================================================================
  
  private createCharactersMenu(): void {
    this.charactersContainer = this.add.container(0, 0);
    this.charactersContainer.setVisible(false);
    
    const title = this.createMenuTitle('SELECT CHARACTER');
    
    // Character data
    const characters: CharacterInfo[] = [
      { id: 'wizard', name: 'Wizard', description: 'Balanced magic user', color: 0x6366f1, unlocked: true },
      { id: 'pyro', name: 'Pyromancer', description: 'Fire specialist', color: 0xef4444, unlocked: true },
      { id: 'cryo', name: 'Cryomancer', description: 'Ice and control', color: 0x3b82f6, unlocked: false },
      { id: 'storm', name: 'Stormcaller', description: 'Lightning speed', color: 0xfbbf24, unlocked: false },
      { id: 'shadow', name: 'Shadowmage', description: 'Stealth and DoT', color: 0x7c3aed, unlocked: false },
    ];
    
    // Create character portraits in a row
    const startX = 50;
    const spacing = 75;
    const y = 120;
    
    characters.forEach((char, index) => {
      const portrait = this.createCharacterPortrait(char, startX + index * spacing, y);
      this.charactersContainer.add(portrait);
    });
    
    // Character description area
    const descBox = this.add.graphics();
    descBox.fillStyle(0x1a1a2e, 0.8);
    descBox.fillRoundedRect(20, 180, GAME_WIDTH - 40, 50, 4);
    
    const descText = this.add.text(GAME_WIDTH / 2, 205, 'Select a character to view details', {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: '#888888',
      align: 'center',
    }).setOrigin(0.5).setName('charDesc');
    
    // Back button
    const backBtn = this.createBackButton(() => this.showMenu('main'));
    
    this.charactersContainer.add([title, descBox, descText, backBtn]);
  }
  
  private createCharacterPortrait(char: CharacterInfo, x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const size = 50;
    
    // Portrait frame
    const frame = this.add.graphics();
    frame.fillStyle(char.unlocked ? char.color : 0x333333, char.unlocked ? 0.3 : 0.2);
    frame.fillRoundedRect(-size / 2, -size / 2, size, size, 6);
    frame.lineStyle(2, char.unlocked ? char.color : 0x444444, 0.8);
    frame.strokeRoundedRect(-size / 2, -size / 2, size, size, 6);
    
    // Character icon (placeholder - first letter)
    const icon = this.add.text(0, -5, char.unlocked ? char.name[0] : '?', {
      fontFamily: 'Arial Black',
      fontSize: '20px',
      color: char.unlocked ? '#ffffff' : '#444444',
    }).setOrigin(0.5);
    
    // Name below
    const name = this.add.text(0, size / 2 + 8, char.name, {
      fontFamily: 'Arial',
      fontSize: '8px',
      color: char.unlocked ? '#ffffff' : '#444444',
    }).setOrigin(0.5);
    
    container.add([frame, icon, name]);
    
    // Interactivity
    if (char.unlocked) {
      const hitArea = this.add.rectangle(0, 0, size, size, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
      
      hitArea.on('pointerover', () => {
        frame.clear();
        frame.fillStyle(char.color, 0.6);
        frame.fillRoundedRect(-size / 2, -size / 2, size, size, 6);
        frame.lineStyle(3, char.color, 1);
        frame.strokeRoundedRect(-size / 2, -size / 2, size, size, 6);
        
        // Update description
        const descText = this.charactersContainer.getByName('charDesc') as Phaser.GameObjects.Text;
        if (descText) {
          descText.setText(`${char.name}\n${char.description}`);
          descText.setColor('#ffffff');
        }
      });
      
      hitArea.on('pointerout', () => {
        frame.clear();
        frame.fillStyle(char.color, 0.3);
        frame.fillRoundedRect(-size / 2, -size / 2, size, size, 6);
        frame.lineStyle(2, char.color, 0.8);
        frame.strokeRoundedRect(-size / 2, -size / 2, size, size, 6);
      });
      
      hitArea.on('pointerdown', () => {
        this.selectedCharacter = char.id;
        this.showMenu('play');
      });
      
      container.add(hitArea);
    }
    
    // Lock icon for locked characters
    if (!char.unlocked) {
      const lock = this.add.text(0, -5, '🔒', {
        fontSize: '16px',
      }).setOrigin(0.5);
      container.add(lock);
    }
    
    return container;
  }
  
  // ===========================================================================
  // ACHIEVEMENTS MENU
  // ===========================================================================
  
  private createAchievementsMenu(): void {
    this.achievementsContainer = this.add.container(0, 0);
    this.achievementsContainer.setVisible(false);
    
    const title = this.createMenuTitle('ACHIEVEMENTS');
    
    // Achievement data (sample)
    const achievements = [
      { id: 'first_kill', name: 'First Blood', description: 'Defeat your first enemy', unlocked: true, icon: '⚔️' },
      { id: 'floor_clear', name: 'Floor Cleared', description: 'Complete a dungeon floor', unlocked: true, icon: '🏆' },
      { id: 'boss_kill', name: 'Boss Slayer', description: 'Defeat a boss', unlocked: false, icon: '👑' },
      { id: 'no_damage', name: 'Untouchable', description: 'Clear a floor without damage', unlocked: false, icon: '✨' },
      { id: 'speedrun', name: 'Speed Demon', description: 'Clear a dungeon in 10 minutes', unlocked: false, icon: '⚡' },
      { id: 'collector', name: 'Spell Collector', description: 'Unlock 10 spells', unlocked: false, icon: '📚' },
    ];
    
    // Create achievement list
    const startY = 65;
    const rowHeight = 30;
    
    achievements.forEach((ach, index) => {
      const row = this.createAchievementRow(ach, startY + index * rowHeight);
      this.achievementsContainer.add(row);
    });
    
    // Stats summary
    const unlocked = achievements.filter(a => a.unlocked).length;
    const stats = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 50, `${unlocked}/${achievements.length} Unlocked`, {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: '#888888',
    }).setOrigin(0.5);
    
    // Back button
    const backBtn = this.createBackButton(() => this.showMenu('main'));
    
    this.achievementsContainer.add([title, stats, backBtn]);
  }
  
  private createAchievementRow(ach: { id: string; name: string; description: string; unlocked: boolean; icon: string }, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(GAME_WIDTH / 2, y);
    const width = 220;
    const height = 26;
    
    // Background
    const bg = this.add.graphics();
    bg.fillStyle(ach.unlocked ? 0x22c55e : 0x333333, ach.unlocked ? 0.2 : 0.1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 3);
    
    // Icon
    const icon = this.add.text(-width / 2 + 15, 0, ach.icon, {
      fontSize: '12px',
    }).setOrigin(0.5);
    if (!ach.unlocked) icon.setAlpha(0.3);
    
    // Name
    const name = this.add.text(-width / 2 + 35, -5, ach.name, {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: ach.unlocked ? '#ffffff' : '#666666',
    });
    
    // Description
    const desc = this.add.text(-width / 2 + 35, 6, ach.description, {
      fontFamily: 'Arial',
      fontSize: '7px',
      color: ach.unlocked ? '#888888' : '#444444',
    });
    
    // Check mark for unlocked
    if (ach.unlocked) {
      const check = this.add.text(width / 2 - 15, 0, '✓', {
        fontFamily: 'Arial',
        fontSize: '14px',
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
    
    const title = this.createMenuTitle('SETTINGS');
    
    // Settings options
    const startY = 80;
    const spacing = 35;
    
    // Master Volume
    const masterSlider = this.createSlider('Master Volume', startY, 0.8);
    
    // Music Volume
    const musicSlider = this.createSlider('Music Volume', startY + spacing, 0.6);
    
    // SFX Volume
    const sfxSlider = this.createSlider('Sound Effects', startY + spacing * 2, 0.8);
    
    // Screen Shake toggle
    const shakeToggle = this.createToggle('Screen Shake', startY + spacing * 3, true);
    
    // Damage Numbers toggle
    const damageToggle = this.createToggle('Damage Numbers', startY + spacing * 4, true);
    
    // Back button
    const backBtn = this.createBackButton(() => this.showMenu('main'));
    
    this.settingsContainer.add([title, masterSlider, musicSlider, sfxSlider, shakeToggle, damageToggle, backBtn]);
  }
  
  private createSlider(label: string, y: number, value: number): Phaser.GameObjects.Container {
    const container = this.add.container(GAME_WIDTH / 2, y);
    const sliderWidth = 120;
    
    // Label
    const text = this.add.text(-100, 0, label, {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: '#ffffff',
    }).setOrigin(0, 0.5);
    
    // Slider track
    const track = this.add.graphics();
    track.fillStyle(0x333333, 1);
    track.fillRoundedRect(20, -4, sliderWidth, 8, 4);
    
    // Slider fill
    const fill = this.add.graphics();
    fill.fillStyle(0x6366f1, 1);
    fill.fillRoundedRect(20, -4, sliderWidth * value, 8, 4);
    
    // Slider handle
    const handleX = 20 + sliderWidth * value;
    const handle = this.add.circle(handleX, 0, 6, 0xffffff);
    
    // Value text
    const valueText = this.add.text(150, 0, `${Math.round(value * 100)}%`, {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: '#888888',
    }).setOrigin(0, 0.5);
    
    // Make interactive
    const hitArea = this.add.rectangle(20 + sliderWidth / 2, 0, sliderWidth, 20, 0x000000, 0)
      .setInteractive({ useHandCursor: true, draggable: true });
    
    hitArea.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number) => {
      const newValue = Phaser.Math.Clamp((dragX - 20) / sliderWidth, 0, 1);
      fill.clear();
      fill.fillStyle(0x6366f1, 1);
      fill.fillRoundedRect(20, -4, sliderWidth * newValue, 8, 4);
      handle.x = 20 + sliderWidth * newValue;
      valueText.setText(`${Math.round(newValue * 100)}%`);
    });
    
    container.add([text, track, fill, handle, valueText, hitArea]);
    return container;
  }
  
  private createToggle(label: string, y: number, value: boolean): Phaser.GameObjects.Container {
    const container = this.add.container(GAME_WIDTH / 2, y);
    
    // Label
    const text = this.add.text(-100, 0, label, {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: '#ffffff',
    }).setOrigin(0, 0.5);
    
    // Toggle background
    const bg = this.add.graphics();
    const drawToggle = (on: boolean) => {
      bg.clear();
      bg.fillStyle(on ? 0x22c55e : 0x444444, 1);
      bg.fillRoundedRect(100, -8, 36, 16, 8);
      bg.fillStyle(0xffffff, 1);
      bg.fillCircle(on ? 128 : 108, 0, 6);
    };
    drawToggle(value);
    
    // Hit area
    const hitArea = this.add.rectangle(118, 0, 36, 16, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    
    let isOn = value;
    hitArea.on('pointerdown', () => {
      isOn = !isOn;
      drawToggle(isOn);
    });
    
    container.add([text, bg, hitArea]);
    return container;
  }
  
  // ===========================================================================
  // HELPERS
  // ===========================================================================
  
  private createMenuTitle(text: string): Phaser.GameObjects.Text {
    return this.add.text(GAME_WIDTH / 2, 35, text, {
      fontFamily: 'Arial Black, Arial',
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#6366f1',
      strokeThickness: 1,
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
    const width = 140;
    const height = 22;
    
    // Button background
    const bg = this.add.graphics();
    const drawButton = (hover: boolean) => {
      bg.clear();
      bg.fillStyle(color, hover ? 0.8 : 0.4);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 4);
      bg.lineStyle(hover ? 2 : 1, color, 1);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 4);
    };
    drawButton(false);
    
    // Button text
    const label = this.add.text(0, 0, text, {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#ffffff',
    }).setOrigin(0.5);
    
    // Hit area
    const hitArea = this.add.rectangle(0, 0, width, height, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    
    hitArea.on('pointerover', () => {
      drawButton(true);
      label.setScale(1.05);
    });
    
    hitArea.on('pointerout', () => {
      drawButton(false);
      label.setScale(1);
    });
    
    hitArea.on('pointerdown', () => {
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
    const container = this.add.container(30, GAME_HEIGHT - 20);
    
    const bg = this.add.graphics();
    bg.fillStyle(0x333333, 0.5);
    bg.fillRoundedRect(-20, -10, 50, 20, 3);
    
    const text = this.add.text(0, 0, '← BACK', {
      fontFamily: 'Arial',
      fontSize: '9px',
      color: '#888888',
    }).setOrigin(0.5);
    
    const hitArea = this.add.rectangle(5, 0, 50, 20, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    
    hitArea.on('pointerover', () => text.setColor('#ffffff'));
    hitArea.on('pointerout', () => text.setColor('#888888'));
    hitArea.on('pointerdown', callback);
    
    container.add([bg, text, hitArea]);
    return container;
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
    
    this.currentState = state;
  }
  
  private startGame(continueRun: boolean): void {
    // Fade out and start game
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
