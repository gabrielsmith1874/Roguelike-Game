/**
 * @file main.ts
 * @description Application entry point. Initializes Phaser game with configuration.
 */

import Phaser from 'phaser';
import { GameConfig } from '@config/GameConfig';
import { CRTPipeline } from '@shaders/CRTShader';

/**
 * Initialize and start the game.
 * This is the single entry point for the entire application.
 */
function startGame(): Phaser.Game {
  // Add CRT pipeline to config before creating game
  const config = {
    ...GameConfig,
    callbacks: {
      postBoot: (game: Phaser.Game) => {
        if (game.renderer.type === Phaser.WEBGL) {
          const renderer = game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
          renderer.pipelines.addPostPipeline('CRTPipeline', CRTPipeline);
        }
      }
    }
  };
  
  const game = new Phaser.Game(config);
  
  // Store game reference globally for debugging (remove in production)
  if (import.meta.env.DEV) {
    (window as unknown as { game: Phaser.Game }).game = game;
  }
  
  return game;
}

// Start the game when DOM is ready
window.addEventListener('load', startGame);
