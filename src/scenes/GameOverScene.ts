/**
 * @file GameOverScene.ts
 * @description Game over screen shown when player dies.
 */

import { BaseScene } from './BaseScene';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '@config/Constants';

/**
 * Game over scene - displayed when player dies.
 */
export class GameOverScene extends BaseScene {
  // Run statistics passed from game scene
  private runStats?: {
    floorsCleared: number;
    enemiesKilled: number;
    spellsCast: number;
    timePlayed: number;
  };
  
  constructor() {
    super(SCENES.GAME_OVER);
  }
  
  init(data: object): void {
    super.init(data);
    this.runStats = data as typeof this.runStats;
  }
  
  create(): void {
    super.create();
    
    // Game over title
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 4, 'GAME OVER', {
      fontFamily: 'Arial',
      fontSize: '32px',
      color: '#ff4444',
    }).setOrigin(0.5);
    
    this.displayStats();
    this.createButtons();
  }
  
  /**
   * Display run statistics.
   */
  private displayStats(): void {
    if (!this.runStats) return;
    
    const statsText = [
      `Floors Cleared: ${this.runStats.floorsCleared}`,
      `Enemies Defeated: ${this.runStats.enemiesKilled}`,
      `Spells Cast: ${this.runStats.spellsCast}`,
      `Time: ${this.formatTime(this.runStats.timePlayed)}`,
    ].join('\n');
    
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, statsText, {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5);
  }
  
  /**
   * Create navigation buttons.
   */
  private createButtons(): void {
    const centerX = GAME_WIDTH / 2;
    const buttonY = GAME_HEIGHT * 0.75;
    
    // Try again
    this.createButton('Try Again', centerX - 60, buttonY, () => {
      this.goToScene(SCENES.GAME);
    });
    
    // Main menu
    this.createButton('Main Menu', centerX + 60, buttonY, () => {
      this.goToScene(SCENES.MENU);
    });
  }
  
  /**
   * Create a button.
   */
  private createButton(
    text: string,
    x: number,
    y: number,
    callback: () => void
  ): void {
    const button = this.add.text(x, y, text, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#cccccc',
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    
    button.on('pointerover', () => button.setColor('#ffffff'));
    button.on('pointerout', () => button.setColor('#cccccc'));
    button.on('pointerdown', callback);
  }
  
  /**
   * Format time in mm:ss.
   */
  private formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}
