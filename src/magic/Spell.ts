/**
 * @file Spell.ts
 * @description Base spell class and spell data definitions.
 */

import Phaser from 'phaser';
import type { Entity } from '@entities/Entity';
import type { MagicElement } from './elements/Element';

/**
 * Spell targeting types.
 */
export enum SpellTargetType {
  /** Fires in a direction */
  PROJECTILE = 'projectile',
  /** Affects area around caster */
  SELF_AOE = 'self_aoe',
  /** Affects area at target location */
  TARGET_AOE = 'target_aoe',
  /** Instant effect on self */
  SELF = 'self',
  /** Creates a zone that persists */
  ZONE = 'zone',
  /** Beam/ray attack */
  BEAM = 'beam',
  /** Summons an entity */
  SUMMON = 'summon',
}

/**
 * Spell rarity levels.
 */
export enum SpellRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

/**
 * Spell data definition - loaded from JSON.
 */
export interface SpellData {
  id: string;
  name: string;
  description: string;
  
  // Core stats
  element: MagicElement;
  targetType: SpellTargetType;
  rarity: SpellRarity;
  
  // Costs
  manaCost: number;
  cooldown: number; // ms
  
  // Damage/effects
  baseDamage: number;
  projectileSpeed?: number;
  projectileCount?: number;
  spread?: number; // degrees
  piercing?: boolean;
  
  // AOE
  aoeRadius?: number;
  
  // Status effects
  statusEffects?: string[];
  statusDuration?: number;
  statusChance?: number;
  
  // Visual
  spriteKey: string;
  soundKey?: string;
  particleKey?: string;
}

/**
 * Runtime spell instance.
 * Wraps SpellData with runtime behavior.
 */
export abstract class Spell {
  protected data: SpellData;
  protected scene: Phaser.Scene;
  
  constructor(scene: Phaser.Scene, data: SpellData) {
    this.scene = scene;
    this.data = data;
  }
  
  /**
   * Get spell ID.
   */
  public getId(): string {
    return this.data.id;
  }
  
  /**
   * Get spell name.
   */
  public getName(): string {
    return this.data.name;
  }
  
  /**
   * Get mana cost.
   */
  public getManaCost(): number {
    return this.data.manaCost;
  }
  
  /**
   * Get cooldown in ms.
   */
  public getCooldown(): number {
    return this.data.cooldown;
  }
  
  /**
   * Get spell element.
   */
  public getElement(): MagicElement {
    return this.data.element;
  }
  
  /**
   * Get base damage.
   */
  public getBaseDamage(): number {
    return this.data.baseDamage;
  }
  
  /**
   * Cast the spell.
   * 
   * @param caster - Entity casting the spell
   * @param targetX - Target X position (or direction for projectiles)
   * @param targetY - Target Y position
   */
  public abstract cast(
    caster: Entity,
    targetX: number,
    targetY: number
  ): void;
  
  /**
   * Get spell tooltip text.
   */
  public getTooltip(): string {
    return `${this.data.name}\n` +
           `${this.data.description}\n` +
           `Damage: ${this.data.baseDamage}\n` +
           `Mana: ${this.data.manaCost}\n` +
           `Cooldown: ${this.data.cooldown / 1000}s`;
  }
}
