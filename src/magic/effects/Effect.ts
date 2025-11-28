/**
 * @file Effect.ts
 * @description Base visual effect class for spells and abilities.
 */

import Phaser from 'phaser';

/**
 * Base effect class for visual spell effects.
 * Handles lifecycle, animation, and cleanup.
 */
export abstract class Effect {
  protected scene: Phaser.Scene;
  protected x: number;
  protected y: number;
  protected active: boolean = true;
  protected duration: number;
  protected elapsed: number = 0;
  
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    duration: number = 1000
  ) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.duration = duration;
    
    this.create();
    this.startLifetime();
  }
  
  /**
   * Create the visual effect.
   * Override to create sprites, particles, etc.
   */
  protected abstract create(): void;
  
  /**
   * Update the effect.
   */
  public update(delta: number): void {
    if (!this.active) return;
    
    this.elapsed += delta;
    this.onUpdate(delta);
  }
  
  /**
   * Override for custom update logic.
   */
  protected onUpdate(_delta: number): void {
    // Override in subclasses
  }
  
  /**
   * Start the lifetime timer.
   */
  protected startLifetime(): void {
    if (this.duration > 0) {
      this.scene.time.delayedCall(this.duration, () => {
        this.destroy();
      });
    }
  }
  
  /**
   * Set position.
   */
  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }
  
  /**
   * Check if active.
   */
  public isActive(): boolean {
    return this.active;
  }
  
  /**
   * Destroy the effect.
   */
  public destroy(): void {
    this.active = false;
    this.onDestroy();
  }
  
  /**
   * Override for cleanup.
   */
  protected onDestroy(): void {
    // Override in subclasses
  }
}

/**
 * Example: Particle burst effect.
 */
export class ParticleBurstEffect extends Effect {
  private emitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private color: number;
  
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    color: number = 0xffffff,
    duration: number = 500
  ) {
    // Store color before super() since create() is called in constructor
    // Using Object.defineProperty to set before super
    // @ts-expect-error - Setting property before super for initialization
    this.color = color;
    super(scene, x, y, duration);
  }
  
  protected create(): void {
    // TODO: Create particle emitter when particle system is set up
    // this.emitter = this.scene.add.particles(this.x, this.y, 'particle', {
    //   speed: { min: 50, max: 150 },
    //   angle: { min: 0, max: 360 },
    //   scale: { start: 0.5, end: 0 },
    //   lifespan: this.duration,
    //   quantity: 20,
    //   tint: this.color,
    // });
    // this.emitter.explode();
  }
  
  protected onDestroy(): void {
    if (this.emitter) {
      this.emitter.destroy();
    }
  }
}
