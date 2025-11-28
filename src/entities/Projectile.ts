/**
 * @file Projectile.ts
 * @description Base projectile entity for spells and enemy attacks.
 */

import Phaser from 'phaser';
import { Entity, EntityConfig } from './Entity';
import { SPRITES } from '@utils/PlaceholderSprites';

/**
 * Projectile configuration.
 */
export interface ProjectileConfig extends EntityConfig {
  /** Direction vector (will be normalized) */
  direction: Phaser.Math.Vector2;
  /** Speed in pixels per second */
  speed: number;
  /** Damage on hit */
  damage: number;
  /** Lifetime in milliseconds (0 = infinite until collision) */
  lifetime?: number;
  /** Whether it pierces through enemies */
  piercing?: boolean;
  /** Tags for entities this can hit */
  targetTags?: string[];
  /** Visual effect key */
  effectKey?: string;
}

/**
 * Base projectile class for magical attacks.
 * Uses object pooling for performance.
 */
export class Projectile extends Entity {
  /** Movement direction */
  protected direction: Phaser.Math.Vector2;
  
  /** Speed in pixels per second */
  protected speed: number;
  
  /** Damage on hit */
  protected damage: number;
  
  /** Remaining lifetime */
  protected lifetime: number;
  
  /** Whether this pierces through enemies */
  protected piercing: boolean;
  
  /** Tags of entities this can damage */
  protected targetTags: string[];
  
  /** Entity that fired this projectile */
  protected owner: Entity | null = null;
  
  constructor(scene: Phaser.Scene, config: ProjectileConfig) {
    // Use provided texture or fall back to default fireball
    const entityConfig: EntityConfig = {
      x: config.x,
      y: config.y,
      texture: config.texture ?? SPRITES.SPELL_FIREBALL,
      frame: config.frame ?? 0,
    };
    super(scene, entityConfig);
    
    this.direction = config.direction.normalize();
    this.speed = config.speed;
    this.damage = config.damage;
    this.lifetime = config.lifetime ?? 5000;
    this.piercing = config.piercing ?? false;
    this.targetTags = config.targetTags ?? ['enemy'];
    
    this.addTag('projectile');
  }
  
  /**
   * Initialize the projectile.
   */
  protected initialize(): void {
    this.setupPhysics();
    this.setVelocity();
    this.setupLifetime();
  }
  
  /**
   * Set up physics.
   */
  protected setupPhysics(): void {
    if (!this.sprite?.body) return;
    
    // Small hitbox for projectiles
    this.sprite.body.setSize(8, 8);
    
    // Rotate sprite to face direction
    const angle = this.direction.angle();
    this.sprite.setRotation(angle);
  }
  
  /**
   * Set the projectile velocity.
   */
  protected setVelocity(): void {
    if (!this.sprite) return;
    
    this.sprite.setVelocity(
      this.direction.x * this.speed,
      this.direction.y * this.speed
    );
  }
  
  /**
   * Set up lifetime destruction.
   */
  protected setupLifetime(): void {
    if (this.lifetime > 0) {
      this.scene.time.delayedCall(this.lifetime, () => {
        this.destroy();
      });
    }
  }
  
  /**
   * Set the owner entity.
   */
  public setOwner(owner: Entity): void {
    this.owner = owner;
  }
  
  /**
   * Get the damage value.
   */
  public getDamage(): number {
    return this.damage;
  }
  
  /**
   * Check if this projectile can hit a target.
   */
  public canHit(target: Entity): boolean {
    // Don't hit owner
    if (target === this.owner) return false;
    
    // Check if target has any of our target tags
    return this.targetTags.some((tag) => target.hasTag(tag));
  }
  
  /**
   * Called when hitting a target.
   */
  public onHit(_target: Entity): void {
    if (!this.piercing) {
      this.destroy();
    }
    
    // TODO: Spawn hit effect
  }
  
  /**
   * Called when hitting a wall.
   */
  public onWallHit(): void {
    this.destroy();
    
    // TODO: Spawn wall hit effect
  }
  
  // =========================================================================
  // OBJECT POOLING SUPPORT
  // =========================================================================
  
  /**
   * Reset projectile for reuse from pool.
   */
  public reset(config: ProjectileConfig): void {
    this.active = true;
    this.direction = config.direction.normalize();
    this.speed = config.speed;
    this.damage = config.damage;
    this.lifetime = config.lifetime ?? 5000;
    this.piercing = config.piercing ?? false;
    this.targetTags = config.targetTags ?? ['enemy'];
    
    this.setPosition(config.x, config.y);
    this.sprite.setActive(true);
    this.sprite.setVisible(true);
    
    this.setVelocity();
    this.setupLifetime();
  }
  
  /**
   * Deactivate for pooling instead of destroying.
   */
  public deactivate(): void {
    this.active = false;
    this.sprite.setActive(false);
    this.sprite.setVisible(false);
    this.sprite.setVelocity(0, 0);
  }
}
