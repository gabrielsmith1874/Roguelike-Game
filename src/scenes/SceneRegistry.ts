/**
 * @file SceneRegistry.ts
 * @description Central registry for all game scenes.
 * Add new scenes here to automatically include them in the game.
 */

import { BootScene } from './BootScene';
import { PreloadScene } from './PreloadScene';
import { MenuScene } from './MenuScene';
import { GameScene } from './GameScene';
import { PauseScene } from './PauseScene';
import { GameOverScene } from './GameOverScene';
import { VictoryScene } from './VictoryScene';

/**
 * Scene registry - manages all game scenes.
 * 
 * To add a new scene:
 * 1. Create the scene file extending BaseScene
 * 2. Import it here
 * 3. Add it to the scenes array
 * 4. Add a key to SCENES in Constants.ts
 */
export class SceneRegistry {
  /**
   * Get all scenes for Phaser configuration.
   * Order matters - first scene is started first.
   */
  public static getAllScenes(): typeof Phaser.Scene[] {
    return [
      BootScene,
      PreloadScene,
      MenuScene,
      GameScene,
      PauseScene,
      GameOverScene,
      VictoryScene,
    ];
  }
}
