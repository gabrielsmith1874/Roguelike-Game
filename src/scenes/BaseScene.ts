/**
 * @file BaseScene.ts
 * @description Abstract base class for all game scenes.
 * Provides common functionality and consistent structure.
 */

import Phaser from 'phaser';
import { EventManager } from '@managers/EventManager';

/**
 * Abstract base scene that all game scenes should extend.
 * Provides:
 * - Access to global managers
 * - Common lifecycle hooks
 * - Consistent structure
 */
export abstract class BaseScene extends Phaser.Scene {
  /** Reference to the global event manager */
  protected events!: EventManager;
  
  constructor(key: string) {
    super({ key });
  }
  
  /**
   * Phaser init - called before preload.
   * Override in subclasses, but call super.init(data) first.
   */
  init(_data?: object): void {
    this.events = EventManager.getInstance();
  }
  
  /**
   * Phaser preload - load assets here.
   * Override in subclasses that need to load assets.
   */
  preload(): void {
    // Override in subclasses
  }
  
  /**
   * Phaser create - set up scene objects.
   * Override in subclasses, but call super.create() first.
   */
  create(): void {
    // Override in subclasses
  }
  
  /**
   * Phaser update - game loop.
   * Override in subclasses that need frame updates.
   */
  update(_time: number, _delta: number): void {
    // Override in subclasses
  }
  
  /**
   * Called when scene is shutting down.
   * Clean up event listeners and resources here.
   */
  shutdown(): void {
    // Override in subclasses for cleanup
  }
  
  /**
   * Transition to another scene with optional data.
   */
  protected goToScene(key: string, data?: object): void {
    this.scene.start(key, data);
  }
  
  /**
   * Launch a scene on top of this one (for overlays).
   */
  protected launchOverlay(key: string, data?: object): void {
    this.scene.launch(key, data);
  }
  
  /**
   * Stop an overlay scene.
   */
  protected stopOverlay(key: string): void {
    this.scene.stop(key);
  }
}
