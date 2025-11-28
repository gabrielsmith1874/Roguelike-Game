/**
 * @file main.ts
 * @description Application entry point. Initializes Phaser game with configuration.
 */

import Phaser from 'phaser';
import { GameConfig } from '@config/GameConfig';

/**
 * Initialize and start the game.
 * This is the single entry point for the entire application.
 */
function startGame(): Phaser.Game {
  const game = new Phaser.Game(GameConfig);
  
  // Store game reference globally for debugging (remove in production)
  if (import.meta.env.DEV) {
    (window as unknown as { game: Phaser.Game }).game = game;
  }
  
  return game;
}

// Start the game when DOM is ready
window.addEventListener('load', startGame);
