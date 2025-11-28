/**
 * @file MovementComponent.ts
 * @description Movement and physics component.
 */

import Phaser from 'phaser';
import { Component } from './Component';
import { DODGE_DURATION, DODGE_COOLDOWN } from '@config/Constants';

/**
 * Movement component - handles entity movement and dodge mechanics.
 */
export class MovementComponent extends Component {
  private baseSpeed: number;
  private speedModifier: number = 1.0;
  
  // Dodge roll state
  private isDodging: boolean = false;
  private dodgeDirection: Phaser.Math.Vector2 = new Phaser.Math.Vector2();
  private dodgeTimer: number = 0;
  private dodgeCooldown: number = 0;
  
  // Movement state
  private velocity: Phaser.Math.Vector2 = new Phaser.Math.Vector2();
  private facing: Phaser.Math.Vector2 = new Phaser.Math.Vector2(1, 0);
  
  constructor(baseSpeed: number) {
    super();
    this.baseSpeed = baseSpeed;
  }
  
  /**
   * Update movement state.
   */
  public update(delta: number): void {
    if (this.isDodging) {
      this.updateDodge(delta);
    }
    
    if (this.dodgeCooldown > 0) {
      this.dodgeCooldown -= delta;
    }
  }
  
  /**
   * Update dodge roll.
   */
  private updateDodge(delta: number): void {
    this.dodgeTimer -= delta;
    
    if (this.dodgeTimer <= 0) {
      this.isDodging = false;
      this.dodgeCooldown = DODGE_COOLDOWN;
    }
  }
  
  /**
   * Get the current effective speed.
   */
  public getSpeed(): number {
    let speed = this.baseSpeed * this.speedModifier;
    
    if (this.isDodging) {
      speed *= 2.5; // Dodge speed boost
    }
    
    return speed;
  }
  
  /**
   * Set movement velocity (normalized direction).
   */
  public setVelocity(x: number, y: number): void {
    this.velocity.set(x, y);
    
    // Update facing direction if moving
    if (this.velocity.length() > 0) {
      this.facing.copy(this.velocity).normalize();
    }
  }
  
  /**
   * Get current velocity.
   */
  public getVelocity(): Phaser.Math.Vector2 {
    return this.velocity.clone();
  }
  
  /**
   * Get facing direction.
   */
  public getFacing(): Phaser.Math.Vector2 {
    return this.facing.clone();
  }
  
  /**
   * Set facing direction without moving.
   */
  public setFacing(x: number, y: number): void {
    this.facing.set(x, y).normalize();
  }
  
  /**
   * Attempt to start a dodge roll.
   */
  public startDodge(direction?: Phaser.Math.Vector2): boolean {
    if (this.isDodging || this.dodgeCooldown > 0) {
      return false;
    }
    
    this.isDodging = true;
    this.dodgeTimer = DODGE_DURATION;
    this.dodgeDirection = direction 
      ? direction.clone().normalize() 
      : this.facing.clone();
    
    return true;
  }
  
  /**
   * Check if currently dodging.
   */
  public isCurrentlyDodging(): boolean {
    return this.isDodging;
  }
  
  /**
   * Check if dodge is available.
   */
  public canDodge(): boolean {
    return !this.isDodging && this.dodgeCooldown <= 0;
  }
  
  /**
   * Get dodge direction.
   */
  public getDodgeDirection(): Phaser.Math.Vector2 {
    return this.dodgeDirection.clone();
  }
  
  /**
   * Apply speed modifier (for buffs/debuffs).
   */
  public setSpeedModifier(modifier: number): void {
    this.speedModifier = modifier;
  }
  
  /**
   * Get speed modifier.
   */
  public getSpeedModifier(): number {
    return this.speedModifier;
  }
  
  /**
   * Apply knockback force.
   */
  public applyKnockback(_force: Phaser.Math.Vector2, _duration: number = 200): void {
    // TODO: Implement knockback
    // Could override velocity temporarily or add impulse
  }
}
