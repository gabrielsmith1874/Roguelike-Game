/**
 * @file ManaComponent.ts
 * @description Mana management component for spell casting.
 */

import { Component } from './Component';
import { EventManager } from '@managers/EventManager';
import { EVENTS, MANA_REGEN_RATE } from '@config/Constants';

/**
 * Mana component - manages entity mana for spell casting.
 */
export class ManaComponent extends Component {
  private current: number;
  private max: number;
  private regenRate: number;
  private regenAccumulator: number = 0;
  private events: EventManager;
  
  constructor(maxMana: number, regenRate: number = MANA_REGEN_RATE) {
    super();
    this.max = maxMana;
    this.current = maxMana;
    this.regenRate = regenRate;
    this.events = EventManager.getInstance();
  }
  
  /**
   * Update mana regeneration.
   */
  public update(delta: number): void {
    if (this.current < this.max) {
      this.regenAccumulator += (this.regenRate * delta) / 1000;
      
      if (this.regenAccumulator >= 1) {
        const regenAmount = Math.floor(this.regenAccumulator);
        this.regenAccumulator -= regenAmount;
        this.restore(regenAmount);
      }
    }
  }
  
  /**
   * Get current mana.
   */
  public getCurrent(): number {
    return this.current;
  }
  
  /**
   * Get maximum mana.
   */
  public getMax(): number {
    return this.max;
  }
  
  /**
   * Get mana as percentage (0-1).
   */
  public getPercent(): number {
    return this.current / this.max;
  }
  
  /**
   * Check if entity can afford a mana cost.
   */
  public canAfford(cost: number): boolean {
    return this.current >= cost;
  }
  
  /**
   * Spend mana. Returns true if successful.
   */
  public spend(amount: number): boolean {
    if (!this.canAfford(amount)) return false;
    
    this.current -= amount;
    this.emitChange();
    return true;
  }
  
  /**
   * Restore mana.
   */
  public restore(amount: number): void {
    const previous = this.current;
    this.current = Math.min(this.max, this.current + amount);
    
    if (this.current !== previous) {
      this.emitChange();
    }
  }
  
  /**
   * Set mana directly.
   */
  public setMana(value: number): void {
    this.current = Math.max(0, Math.min(this.max, value));
    this.emitChange();
  }
  
  /**
   * Increase max mana.
   */
  public increaseMaxMana(amount: number, restoreToFull: boolean = false): void {
    this.max += amount;
    if (restoreToFull) {
      this.current = this.max;
    }
    this.emitChange();
  }
  
  /**
   * Set mana regeneration rate.
   */
  public setRegenRate(rate: number): void {
    this.regenRate = rate;
  }
  
  /**
   * Emit mana change event.
   */
  private emitChange(): void {
    if (this.entity.hasTag('player')) {
      this.events.emit(EVENTS.PLAYER_MANA_CHANGED, {
        entity: this.entity,
        current: this.current,
        max: this.max,
      });
    }
  }
}
