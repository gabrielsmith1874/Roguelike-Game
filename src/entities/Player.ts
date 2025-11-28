/**
 * @file Player.ts
 * @description Player entity with all player-specific logic.
 */

import Phaser from 'phaser';
import { Entity, EntityConfig } from './Entity';
import { PLAYER_BASE_HEALTH, PLAYER_BASE_MANA, PLAYER_SPEED } from '@config/Constants';
import { SPRITES } from '@utils/PlaceholderSprites';

// TODO: Import when implemented
// import { HealthComponent } from '@components/HealthComponent';
// import { ManaComponent } from '@components/ManaComponent';
// import { MovementComponent } from '@components/MovementComponent';
// import { SpellCasterComponent } from '@components/SpellCasterComponent';

/**
 * Player entity - the character controlled by the user.
 * 
 * Components:
 * - HealthComponent: Hit points and damage handling
 * - ManaComponent: Mana pool for casting spells
 * - MovementComponent: 8-directional movement with dodge roll
 * - SpellCasterComponent: Spell casting and cooldowns
 */
export class Player extends Entity {
  /** Currently equipped spells (indices into spell registry) */
  private equippedSpells: string[] = [];
  
  /** Current movement speed modifier */
  private speedModifier: number = 1.0;
  
  /** Whether player is invulnerable (after taking damage) */
  private invulnerable: boolean = false;
  
  constructor(scene: Phaser.Scene, x: number, y: number, characterId: string = 'wizard') {
    // Map character ID to sprite key
    const textureMap: Record<string, string> = {
      wizard: SPRITES.PLAYER_WIZARD,
      pyro: SPRITES.PLAYER_PYRO,
      cryo: SPRITES.PLAYER_CRYO,
      storm: SPRITES.PLAYER_STORM,
      shadow: SPRITES.PLAYER_SHADOW,
    };
    
    const config: EntityConfig = {
      x,
      y,
      texture: textureMap[characterId] ?? SPRITES.PLAYER_WIZARD,
      frame: 0,
    };
    super(scene, config);
    
    this.addTag('player');
  }
  
  /**
   * Initialize player components.
   */
  protected initialize(): void {
    // TODO: Add components when implemented
    // this.addComponent(new HealthComponent(PLAYER_BASE_HEALTH));
    // this.addComponent(new ManaComponent(PLAYER_BASE_MANA));
    // this.addComponent(new MovementComponent(PLAYER_SPEED));
    // this.addComponent(new SpellCasterComponent());
    
    this.setupPhysics();
    this.setupAnimations();
  }
  
  /**
   * Set up physics body.
   */
  private setupPhysics(): void {
    if (!this.sprite?.body) return;
    
    // Set hitbox size (smaller than sprite for fair gameplay)
    this.sprite.body.setSize(12, 12);
    this.sprite.body.setOffset(2, 4);
    
    // Enable collision with world bounds
    this.sprite.setCollideWorldBounds(true);
  }
  
  /**
   * Set up player animations.
   */
  private setupAnimations(): void {
    // TODO: Create animations when spritesheet is ready
    // Example:
    // this.scene.anims.create({
    //   key: 'player_idle',
    //   frames: this.scene.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
    //   frameRate: 8,
    //   repeat: -1
    // });
  }
  
  /**
   * Handle movement input.
   */
  public handleMovement(direction: Phaser.Math.Vector2): void {
    if (!this.sprite?.body) return;
    
    const speed = PLAYER_SPEED * this.speedModifier;
    
    // Normalize and apply velocity
    if (direction.length() > 0) {
      direction.normalize();
      this.sprite.setVelocity(
        direction.x * speed,
        direction.y * speed
      );
    } else {
      this.sprite.setVelocity(0, 0);
    }
  }
  
  /**
   * Perform dodge roll.
   */
  public dodgeRoll(_direction: Phaser.Math.Vector2): void {
    // TODO: Implement dodge roll
    // - Set invulnerable
    // - Boost speed temporarily
    // - Play dodge animation
    // - Start cooldown
  }
  
  /**
   * Cast a spell in the given direction.
   */
  public castSpell(_slotIndex: number, _targetX: number, _targetY: number): void {
    // TODO: Implement spell casting
    // - Check mana
    // - Check cooldown
    // - Create projectile
    // - Deduct mana
  }
  
  /**
   * Take damage from a source.
   */
  public takeDamage(amount: number, _source?: Entity): void {
    if (this.invulnerable) return;
    
    // TODO: Apply damage through HealthComponent
    // const health = this.getComponent(HealthComponent);
    // if (health) {
    //   health.damage(amount);
    // }
    
    // Temporary invulnerability
    this.setInvulnerable(true);
    
    // Screen shake feedback
    this.scene.cameras.main.shake(100, 0.01);
    
    // Log for debugging
    console.warn(`Player took ${amount} damage`);
  }
  
  /**
   * Set invulnerability state.
   */
  private setInvulnerable(value: boolean): void {
    this.invulnerable = value;
    
    if (value) {
      // Flash effect
      this.sprite.setAlpha(0.5);
      
      // TODO: Use INVULN_DURATION from constants
      this.scene.time.delayedCall(1000, () => {
        this.setInvulnerable(false);
      });
    } else {
      this.sprite.setAlpha(1);
    }
  }
  
  /**
   * Equip a spell to a slot.
   */
  public equipSpell(spellId: string, slot: number): void {
    this.equippedSpells[slot] = spellId;
  }
  
  /**
   * Get equipped spell at slot.
   */
  public getEquippedSpell(slot: number): string | undefined {
    return this.equippedSpells[slot];
  }
  
  /**
   * Apply a speed modifier.
   */
  public setSpeedModifier(modifier: number): void {
    this.speedModifier = modifier;
  }
}
