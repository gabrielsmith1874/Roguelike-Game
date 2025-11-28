/**
 * @file Component.ts
 * @description Base component class for entity composition pattern.
 */

import type { Entity } from '@entities/Entity';

/**
 * Base component class.
 * Components add specific behaviors/data to entities.
 * 
 * Design principles:
 * - Components should be single-responsibility
 * - Components should not reference other components directly
 * - Use events/signals for cross-component communication
 * 
 * @example
 * ```ts
 * class HealthComponent extends Component {
 *   private current: number;
 *   private max: number;
 *   
 *   constructor(maxHealth: number) {
 *     super();
 *     this.max = maxHealth;
 *     this.current = maxHealth;
 *   }
 *   
 *   damage(amount: number): void {
 *     this.current = Math.max(0, this.current - amount);
 *   }
 * }
 * ```
 */
export abstract class Component {
  /** The entity this component belongs to */
  protected entity!: Entity;
  
  /** Whether this component is enabled */
  public enabled: boolean = true;
  
  /**
   * Set the owning entity.
   * Called automatically when component is added to entity.
   */
  public setEntity(entity: Entity): void {
    this.entity = entity;
    this.onAttach();
  }
  
  /**
   * Called when component is attached to an entity.
   * Override for initialization that requires entity reference.
   */
  protected onAttach(): void {
    // Override in subclasses
  }
  
  /**
   * Update the component each frame.
   */
  public update(_delta: number): void {
    // Override in subclasses
  }
  
  /**
   * Clean up when component is removed.
   */
  public destroy(): void {
    // Override in subclasses for cleanup
  }
}
