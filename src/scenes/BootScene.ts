/**
 * @file BootScene.ts
 * @description First scene to run. Loads minimal assets needed for preloader.
 */

import Phaser from 'phaser';
import { SCENES } from '@config/Constants';
import { generatePlaceholders } from '@utils/PlaceholderSprites';

/**
 * Boot scene - initializes game and loads preloader assets.
 * Keep this minimal - only load what's needed for the loading screen.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.BOOT });
  }
  
  preload(): void {
    // TODO: Load minimal assets for loading screen
    // Example: loading bar graphics, logo
  }
  
  create(): void {
    // Generate placeholder sprites for development
    // These will be replaced when real sprites are loaded
    generatePlaceholders(this);
    
    // Initialize any global systems here
    
    // Proceed to preload scene
    this.scene.start(SCENES.PRELOAD);
  }
}
