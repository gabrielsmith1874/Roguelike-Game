/**
 * @file VictoryScene.ts
 * @description Victory screen shown when player completes the game.
 */

import { BaseScene } from './BaseScene';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '@config/Constants';

/**
 * Victory scene - displayed when player defeats final boss.
 */
export class VictoryScene extends BaseScene {
  constructor() {
    super(SCENES.VICTORY);
  }
  
  create(): void {
    super.create();
    
    // Victory title
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 4, 'VICTORY!', {
      fontFamily: 'Arial',
      fontSize: '32px',
      color: '#44ff44',
    }).setOrigin(0.5);
    
    // TODO: Display final stats
    // TODO: Display unlocks
    
    // Return to menu button
    const button = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.75, 'Main Menu', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#cccccc',
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    
    button.on('pointerover', () => button.setColor('#ffffff'));
    button.on('pointerout', () => button.setColor('#cccccc'));
    button.on('pointerdown', () => this.goToScene(SCENES.MENU));
  }
}
