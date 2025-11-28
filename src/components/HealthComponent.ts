/**
 * @file HealthComponent.ts
 * @description Health management component.
 */

import { Component } from './Component';
import { EventManager } from '@managers/EventManager';
import { EVENTS } from '@config/Constants';

/**
 * Health component - manages entity health.
 */
export class HealthComponent extends Component {
  private current: number;
  private max: number;
  private events: EventManager;
  
  constructor(maxHealth: number) {
    super();
    this.max = maxHealth;
    this.current = maxHealth;
    this.events = EventManager.getInstance();
  }
  
  /**
   * Get current health.
   */
  public getCurrent(): number {
    return this.current;
  }
  
  /**
   * Get maximum health.
   */
  public getMax(): number {
    return this.max;
  }
  
  /**
   * Get health as percentage (0-1).
   */
  public getPercent(): number {
    return this.current / this.max;
  }
  
  /**
   * Check if dead.
   */
  public isDead(): boolean {
    return this.current <= 0;
  }
  
  /**
   * Deal damage to this entity.
   */
  public damage(amount: number): void {
    const previousHealth = this.current;
    this.current = Math.max(0, this.current - amount);
    
    if (this.entity.hasTag('player')) {
      this.events.emit(EVENTS.PLAYER_DAMAGED, {
        entity: this.entity,
        amount,
        current: this.current,
        previous: previousHealth,
      });
    } else if (this.entity.hasTag('enemy')) {
      this.events.emit(EVENTS.ENEMY_DAMAGED, {
        entity: this.entity,
        amount,
        current: this.current,
      });
    }
    
    if (this.isDead()) {
      this.onDeath();
    }
  }
  
  /**
   * Heal this entity.
   */
  public heal(amount: number): void {
    const previousHealth = this.current;
    this.current = Math.min(this.max, this.current + amount);
    
    if (this.entity.hasTag('player')) {
      this.events.emit(EVENTS.PLAYER_HEALED, {
        entity: this.entity,
        amount: this.current - previousHealth,
        current: this.current,
      });
    }
  }
  
  /**
   * Set health directly.
   */
  public setHealth(value: number): void {
    this.current = Math.max(0, Math.min(this.max, value));
  }
  
  /**
   * Increase max health.
   */
  public increaseMaxHealth(amount: number, healToFull: boolean = false): void {
    this.max += amount;
    if (healToFull) {
      this.current = this.max;
    }
  }
  
  /**
   * Handle death.
   */
  private onDeath(): void {
    if (this.entity.hasTag('player')) {
      this.events.emit(EVENTS.PLAYER_DIED, { entity: this.entity });
    } else if (this.entity.hasTag('enemy')) {
      this.events.emit(EVENTS.ENEMY_KILLED, { entity: this.entity });
    }
  }
}
