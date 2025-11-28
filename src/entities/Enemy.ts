/**
 * @file Enemy.ts
 * @description Base enemy entity with AI behavior hooks.
 */

import Phaser from 'phaser';
import { Entity, EntityConfig } from './Entity';
import { EventManager } from '@managers/EventManager';
import { EVENTS } from '@config/Constants';
import { SPRITES } from '@utils/PlaceholderSprites';

/**
 * Enemy behavior types for AI.
 */
export enum EnemyBehavior {
  /** Moves toward player and attacks at close range */
  MELEE = 'melee',
  /** Keeps distance and shoots projectiles */
  RANGED = 'ranged',
  /** Circles around player */
  CIRCLING = 'circling',
  /** Charges at player */
  CHARGING = 'charging',
  /** Stays stationary, attacks when in range */
  TURRET = 'turret',
}

/**
 * Enemy configuration.
 */
export interface EnemyConfig extends EntityConfig {
  x: number;
  y: number;
  texture?: string;
  enemyType?: string;
  health: number;
  damage: number;
  speed: number;
  behavior: EnemyBehavior;
  detectionRadius?: number;
  attackRange?: number;
  attackCooldown?: number;
}

/** Map enemy type IDs to sprite keys */
const ENEMY_SPRITES: Record<string, string> = {
  slime: SPRITES.ENEMY_SLIME,
  skeleton: SPRITES.ENEMY_SKELETON,
  imp: SPRITES.ENEMY_IMP,
  ghost: SPRITES.ENEMY_GHOST,
  golem: SPRITES.ENEMY_GOLEM,
  boss_flame_lord: SPRITES.BOSS_FLAME_LORD,
  boss_frost_queen: SPRITES.BOSS_FROST_QUEEN,
};

/**
 * Base enemy class - extend for specific enemy types.
 * 
 * @example
 * ```ts
 * class Skeleton extends Enemy {
 *   constructor(scene: Phaser.Scene, x: number, y: number) {
 *     super(scene, {
 *       x, y,
 *       texture: 'enemies',
 *       frame: 0,
 *       health: 30,
 *       damage: 10,
 *       speed: 60,
 *       behavior: EnemyBehavior.MELEE,
 *     });
 *   }
 * }
 * ```
 */
export abstract class Enemy extends Entity {
  /** Enemy stats */
  protected health: number;
  protected maxHealth: number;
  protected damage: number;
  protected speed: number;
  
  /** AI configuration */
  protected behavior: EnemyBehavior;
  protected detectionRadius: number;
  protected attackRange: number;
  protected attackCooldown: number;
  protected lastAttackTime: number = 0;
  
  /** Current AI state */
  protected currentState: 'idle' | 'chasing' | 'attacking' | 'fleeing' = 'idle';
  
  /** Reference to target (usually player) */
  protected target: Entity | null = null;
  
  constructor(scene: Phaser.Scene, config: EnemyConfig) {
    // Resolve texture from enemy type or use provided texture
    const texture = config.texture ?? 
                    (config.enemyType ? ENEMY_SPRITES[config.enemyType] : SPRITES.ENEMY_SLIME) ??
                    SPRITES.ENEMY_SLIME;
    
    const entityConfig: EntityConfig = {
      x: config.x,
      y: config.y,
      texture,
      frame: 0,
    };
    super(scene, entityConfig);
    
    this.health = config.health;
    this.maxHealth = config.health;
    this.damage = config.damage;
    this.speed = config.speed;
    this.behavior = config.behavior;
    this.detectionRadius = config.detectionRadius ?? 150;
    this.attackRange = config.attackRange ?? 20;
    this.attackCooldown = config.attackCooldown ?? 1000;
    
    this.addTag('enemy');
  }
  
  /**
   * Initialize the enemy.
   */
  protected initialize(): void {
    this.setupPhysics();
    this.setupAnimations();
  }
  
  /**
   * Set up physics body.
   */
  protected setupPhysics(): void {
    if (!this.sprite?.body) return;
    
    this.sprite.body.setSize(14, 14);
    this.sprite.body.setOffset(1, 2);
  }
  
  /**
   * Set up animations - override in subclasses.
   */
  protected abstract setupAnimations(): void;
  
  /**
   * Update AI behavior.
   */
  public update(delta: number): void {
    super.update(delta);
    
    if (!this.active) return;
    
    this.updateAI(delta);
  }
  
  /**
   * Update AI state machine.
   */
  protected updateAI(_delta: number): void {
    if (!this.target) return;
    
    const distance = this.getDistanceToTarget();
    
    // State transitions
    switch (this.currentState) {
      case 'idle':
        if (distance < this.detectionRadius) {
          this.currentState = 'chasing';
        }
        break;
        
      case 'chasing':
        if (distance > this.detectionRadius * 1.5) {
          this.currentState = 'idle';
        } else if (distance < this.attackRange) {
          this.currentState = 'attacking';
        } else {
          this.moveTowardTarget();
        }
        break;
        
      case 'attacking':
        if (distance > this.attackRange * 1.2) {
          this.currentState = 'chasing';
        } else {
          this.tryAttack();
        }
        break;
    }
  }
  
  /**
   * Move toward the target.
   */
  protected moveTowardTarget(): void {
    if (!this.target || !this.sprite?.body) return;
    
    const targetPos = this.target.getPosition();
    const myPos = this.getPosition();
    
    const direction = new Phaser.Math.Vector2(
      targetPos.x - myPos.x,
      targetPos.y - myPos.y
    ).normalize();
    
    this.sprite.setVelocity(
      direction.x * this.speed,
      direction.y * this.speed
    );
  }
  
  /**
   * Attempt to attack if off cooldown.
   */
  protected tryAttack(): void {
    const now = Date.now();
    if (now - this.lastAttackTime < this.attackCooldown) return;
    
    this.lastAttackTime = now;
    this.performAttack();
  }
  
  /**
   * Perform the attack - override for different attack types.
   */
  protected abstract performAttack(): void;
  
  /**
   * Get distance to current target.
   */
  protected getDistanceToTarget(): number {
    if (!this.target) return Infinity;
    
    return Phaser.Math.Distance.Between(
      this.sprite.x,
      this.sprite.y,
      this.target.sprite.x,
      this.target.sprite.y
    );
  }
  
  /**
   * Set the target entity.
   */
  public setTarget(target: Entity): void {
    this.target = target;
  }
  
  /**
   * Take damage.
   */
  public takeDamage(amount: number, knockbackDirection?: Phaser.Math.Vector2): void {
    this.health -= amount;
    
    // Visual feedback
    this.flashWhite();
    
    // Knockback
    if (knockbackDirection && this.sprite?.body) {
      this.sprite.setVelocity(
        knockbackDirection.x * 100,
        knockbackDirection.y * 100
      );
    }
    
    // Death check
    if (this.health <= 0) {
      this.die();
    }
  }
  
  /**
   * Flash white on hit.
   */
  protected flashWhite(): void {
    this.sprite.setTint(0xffffff);
    this.scene.time.delayedCall(100, () => {
      this.sprite.clearTint();
    });
  }
  
  /**
   * Handle death.
   */
  protected die(): void {
    // TODO: Spawn drops, play death animation, emit event
    this.destroy();
  }
  
  /**
   * Get current health.
   */
  public getHealth(): number {
    return this.health;
  }
  
  /**
   * Get max health.
   */
  public getMaxHealth(): number {
    return this.maxHealth;
  }
}
