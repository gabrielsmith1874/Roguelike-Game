/**
 * @file PauseScene.ts
 * @description Pause menu overlay.
 */

import { BaseScene } from './BaseScene';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '@config/Constants';

/**
 * Pause menu - displayed as overlay on top of game.
 */
export class PauseScene extends BaseScene {
  constructor() {
    super(SCENES.PAUSE);
  }
  
  create(): void {
    super.create();
    
    // Semi-transparent background
    this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.7
    );
    
    // Pause title
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 4, 'PAUSED', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5);
    
    this.createMenuOptions();
    this.setupInput();
  }
  
  /**
   * Create pause menu options.
   */
  private createMenuOptions(): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;
    const spacing = 30;
    
    this.createButton('Resume', centerX, centerY, () => this.resumeGame());
    this.createButton('Settings', centerX, centerY + spacing, () => {
      // TODO: Open settings
    });
    this.createButton('Quit to Menu', centerX, centerY + spacing * 2, () => {
      this.quitToMenu();
    });
  }
  
  /**
   * Set up input for pause menu.
   */
  private setupInput(): void {
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-ESC', () => {
        this.resumeGame();
      });
    }
  }
  
  /**
   * Create a menu button.
   */
  private createButton(
    text: string,
    x: number,
    y: number,
    callback: () => void
  ): void {
    const button = this.add.text(x, y, text, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#cccccc',
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    
    button.on('pointerover', () => button.setColor('#ffffff'));
    button.on('pointerout', () => button.setColor('#cccccc'));
    button.on('pointerdown', callback);
  }
  
  /**
   * Resume the game.
   */
  private resumeGame(): void {
    this.scene.stop();
    this.scene.resume(SCENES.GAME);
  }
  
  /**
   * Return to main menu.
   */
  private quitToMenu(): void {
    this.scene.stop(SCENES.GAME);
    this.scene.stop();
    this.scene.start(SCENES.MENU);
  }
}
