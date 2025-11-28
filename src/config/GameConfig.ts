/**
 * @file GameConfig.ts
 * @description Main Phaser game configuration.
 */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './Constants';
import { SceneRegistry } from '@scenes/SceneRegistry';

export const GameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  roundPixels: true,
  
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: import.meta.env.DEV,
    },
  },
  
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  
  scene: SceneRegistry.getAllScenes(),
  
  render: {
    antialias: false,
    pixelArt: true,
  },
  
  // Performance optimizations
  fps: {
    target: 60,
    forceSetTimeOut: false,
  },
  
  // Audio configuration
  audio: {
    disableWebAudio: false,
  },
};
