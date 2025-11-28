/**
 * @file Entity.ts
 * @description Base entity class using composition pattern.
 * All game objects (player, enemies, projectiles, etc.) extend this.
 */

import Phaser from 'phaser';
import { Component } from '@components/Component';

/**
 * Unique ID generator for entities.
 */
let entityIdCounter = 0;
function generateEntityId(): number {
  return ++entityIdCounter;
}

/**
 * Entity configuration options.
 */
export interface EntityConfig {
  x: number;
  y: number;
  texture?: string;
  frame?: number;
}

/**
 * Base entity class - foundation for all game objects.
 * Uses composition over inheritance for flexible behavior.
 * 
 * @example
 * ```ts
 * class Goblin extends Entity {
 *   constructor(scene: Phaser.Scene, x: number, y: number) {
 *     super(scene, { x, y, texture: 'enemies', frame: 0 });
 *     this.addComponent(new HealthComponent(50));
 *     this.addComponent(new AIComponent('aggressive'));
 *   }
 * }
 * ```
 */
export abstract class Entity {
  /** Unique identifier for this entity */
  public readonly id: number;
  
  /** Reference to the scene this entity belongs to */
  protected scene: Phaser.Scene;
  
  /** The visual sprite for this entity */
  public sprite!: Phaser.Physics.Arcade.Sprite;
  
  /** Component map for quick lookup */
  private components: Map<string, Component> = new Map();
  
  /** Whether this entity is active */
  protected active: boolean = true;
  
  /** Tags for filtering/grouping entities */
  protected tags: Set<string> = new Set();
  
  constructor(scene: Phaser.Scene, config: EntityConfig) {
    this.id = generateEntityId();
    this.scene = scene;
    
    this.createSprite(config);
    this.initialize();
  }
  
  /**
   * Create the entity's sprite.
   * Override for custom sprite creation.
   */
  protected createSprite(config: EntityConfig): void {
    if (config.texture) {
      this.sprite = this.scene.physics.add.sprite(
        config.x,
        config.y,
        config.texture,
        config.frame
      );
    }
  }
  
  /**
   * Initialize the entity after sprite creation.
   * Override to add components and set up the entity.
   */
  protected abstract initialize(): void;
  
  /**
   * Update the entity each frame.
   */
  public update(delta: number): void {
    if (!this.active) return;
    
    // Update all components
    this.components.forEach((component) => {
      if (component.enabled) {
        component.update(delta);
      }
    });
  }
  
  /**
   * Add a component to this entity.
   */
  public addComponent<T extends Component>(component: T): T {
    const name = component.constructor.name;
    component.setEntity(this);
    this.components.set(name, component);
    return component;
  }
  
  /**
   * Get a component by type.
   */
  public getComponent<T extends Component>(type: new (...args: unknown[]) => T): T | undefined {
    return this.components.get(type.name) as T | undefined;
  }
  
  /**
   * Check if entity has a component.
   */
  public hasComponent<T extends Component>(type: new (...args: unknown[]) => T): boolean {
    return this.components.has(type.name);
  }
  
  /**
   * Remove a component from this entity.
   */
  public removeComponent<T extends Component>(type: new (...args: unknown[]) => T): void {
    const component = this.components.get(type.name);
    if (component) {
      component.destroy();
      this.components.delete(type.name);
    }
  }
  
  /**
   * Add a tag to this entity.
   */
  public addTag(tag: string): void {
    this.tags.add(tag);
  }
  
  /**
   * Check if entity has a tag.
   */
  public hasTag(tag: string): boolean {
    return this.tags.has(tag);
  }
  
  /**
   * Get entity position.
   */
  public getPosition(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(this.sprite.x, this.sprite.y);
  }
  
  /**
   * Set entity position.
   */
  public setPosition(x: number, y: number): void {
    this.sprite.setPosition(x, y);
  }
  
  /**
   * Check if entity is active.
   */
  public isActive(): boolean {
    return this.active;
  }
  
  /**
   * Destroy the entity and clean up.
   */
  public destroy(): void {
    this.active = false;
    
    // Destroy all components
    this.components.forEach((component) => component.destroy());
    this.components.clear();
    
    // Destroy sprite
    if (this.sprite) {
      this.sprite.destroy();
    }
  }
}
