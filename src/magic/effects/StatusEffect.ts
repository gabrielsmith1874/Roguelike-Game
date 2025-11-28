/**
 * @file StatusEffect.ts
 * @description Status effect system for buffs/debuffs.
 */

import type { Entity } from '@entities/Entity';

/**
 * Status effect types.
 */
export enum StatusEffectType {
  // Debuffs
  BURNING = 'burning',
  FROZEN = 'frozen',
  SHOCKED = 'shocked',
  POISONED = 'poisoned',
  STUNNED = 'stunned',
  SLOWED = 'slowed',
  WEAKENED = 'weakened',
  BLINDED = 'blinded',
  
  // Buffs
  HASTE = 'haste',
  SHIELD = 'shield',
  REGENERATION = 'regeneration',
  EMPOWERED = 'empowered',
  INVULNERABLE = 'invulnerable',
}

/**
 * Status effect data.
 */
export interface StatusEffectData {
  type: StatusEffectType;
  duration: number; // ms
  stacks?: number;
  
  // Effect values
  damagePerTick?: number;
  tickInterval?: number;
  speedModifier?: number;
  damageModifier?: number;
}

/**
 * Active status effect instance.
 */
export class StatusEffect {
  public readonly type: StatusEffectType;
  public duration: number;
  public stacks: number;
  
  protected entity: Entity;
  protected elapsed: number = 0;
  protected tickTimer: number = 0;
  protected tickInterval: number;
  protected damagePerTick: number;
  protected speedModifier: number;
  protected damageModifier: number;
  
  constructor(entity: Entity, data: StatusEffectData) {
    this.entity = entity;
    this.type = data.type;
    this.duration = data.duration;
    this.stacks = data.stacks ?? 1;
    this.tickInterval = data.tickInterval ?? 1000;
    this.damagePerTick = data.damagePerTick ?? 0;
    this.speedModifier = data.speedModifier ?? 1.0;
    this.damageModifier = data.damageModifier ?? 1.0;
    
    this.onApply();
  }
  
  /**
   * Called when effect is first applied.
   */
  protected onApply(): void {
    // Override in subclasses for initial effects
  }
  
  /**
   * Update the status effect.
   */
  public update(delta: number): void {
    this.elapsed += delta;
    
    // Check for tick damage
    if (this.damagePerTick > 0) {
      this.tickTimer += delta;
      while (this.tickTimer >= this.tickInterval) {
        this.tickTimer -= this.tickInterval;
        this.onTick();
      }
    }
  }
  
  /**
   * Called each tick interval.
   */
  protected onTick(): void {
    // TODO: Apply tick damage through entity's health component
    // const health = this.entity.getComponent(HealthComponent);
    // if (health) {
    //   health.damage(this.damagePerTick * this.stacks);
    // }
  }
  
  /**
   * Check if effect has expired.
   */
  public isExpired(): boolean {
    return this.elapsed >= this.duration;
  }
  
  /**
   * Get remaining duration.
   */
  public getRemainingDuration(): number {
    return Math.max(0, this.duration - this.elapsed);
  }
  
  /**
   * Refresh the effect duration.
   */
  public refresh(newDuration?: number): void {
    this.elapsed = 0;
    if (newDuration !== undefined) {
      this.duration = newDuration;
    }
  }
  
  /**
   * Add stacks.
   */
  public addStacks(amount: number, maxStacks: number = 5): void {
    this.stacks = Math.min(this.stacks + amount, maxStacks);
  }
  
  /**
   * Get speed modifier from this effect.
   */
  public getSpeedModifier(): number {
    return this.speedModifier;
  }
  
  /**
   * Get damage modifier from this effect.
   */
  public getDamageModifier(): number {
    return this.damageModifier;
  }
  
  /**
   * Called when effect is removed.
   */
  public onRemove(): void {
    // Override in subclasses for cleanup
  }
}

/**
 * Status effect manager for an entity.
 */
export class StatusEffectManager {
  private entity: Entity;
  private effects: Map<StatusEffectType, StatusEffect> = new Map();
  
  constructor(entity: Entity) {
    this.entity = entity;
  }
  
  /**
   * Apply a status effect.
   */
  public apply(data: StatusEffectData): void {
    const existing = this.effects.get(data.type);
    
    if (existing) {
      // Refresh and add stacks
      existing.refresh(data.duration);
      if (data.stacks) {
        existing.addStacks(data.stacks);
      }
    } else {
      // Create new effect
      const effect = new StatusEffect(this.entity, data);
      this.effects.set(data.type, effect);
    }
  }
  
  /**
   * Remove a status effect.
   */
  public remove(type: StatusEffectType): void {
    const effect = this.effects.get(type);
    if (effect) {
      effect.onRemove();
      this.effects.delete(type);
    }
  }
  
  /**
   * Check if entity has a status effect.
   */
  public has(type: StatusEffectType): boolean {
    return this.effects.has(type);
  }
  
  /**
   * Get a status effect.
   */
  public get(type: StatusEffectType): StatusEffect | undefined {
    return this.effects.get(type);
  }
  
  /**
   * Update all status effects.
   */
  public update(delta: number): void {
    const expired: StatusEffectType[] = [];
    
    for (const [type, effect] of this.effects) {
      effect.update(delta);
      if (effect.isExpired()) {
        expired.push(type);
      }
    }
    
    // Remove expired effects
    for (const type of expired) {
      this.remove(type);
    }
  }
  
  /**
   * Get combined speed modifier from all effects.
   */
  public getSpeedModifier(): number {
    let modifier = 1.0;
    for (const effect of this.effects.values()) {
      modifier *= effect.getSpeedModifier();
    }
    return modifier;
  }
  
  /**
   * Get combined damage modifier from all effects.
   */
  public getDamageModifier(): number {
    let modifier = 1.0;
    for (const effect of this.effects.values()) {
      modifier *= effect.getDamageModifier();
    }
    return modifier;
  }
  
  /**
   * Clear all status effects.
   */
  public clear(): void {
    for (const effect of this.effects.values()) {
      effect.onRemove();
    }
    this.effects.clear();
  }
}
