/**
 * @file SpellCasterComponent.ts
 * @description Spell casting component for managing equipped spells.
 */

import { Component } from './Component';
import { MAX_EQUIPPED_SPELLS } from '@config/Constants';

// TODO: Import when implemented
// import { Spell } from '@magic/Spell';
// import { SpellRegistry } from '@magic/SpellRegistry';

/**
 * Spell slot with cooldown tracking.
 */
interface SpellSlot {
  spellId: string | null;
  currentCooldown: number;
  maxCooldown: number;
}

/**
 * SpellCaster component - manages spell slots and casting.
 */
export class SpellCasterComponent extends Component {
  /** Equipped spell slots */
  private slots: SpellSlot[];
  
  /** Global cooldown between any spell cast */
  private globalCooldown: number = 0;
  private globalCooldownDuration: number = 100; // ms
  
  /** Casting speed modifier */
  private castSpeedModifier: number = 1.0;
  
  constructor(numSlots: number = MAX_EQUIPPED_SPELLS) {
    super();
    
    this.slots = Array.from({ length: numSlots }, () => ({
      spellId: null,
      currentCooldown: 0,
      maxCooldown: 0,
    }));
  }
  
  /**
   * Update cooldowns.
   */
  public update(delta: number): void {
    // Update global cooldown
    if (this.globalCooldown > 0) {
      this.globalCooldown -= delta;
    }
    
    // Update slot cooldowns
    for (const slot of this.slots) {
      if (slot.currentCooldown > 0) {
        slot.currentCooldown -= delta * this.castSpeedModifier;
      }
    }
  }
  
  /**
   * Equip a spell to a slot.
   */
  public equipSpell(slotIndex: number, spellId: string): boolean {
    if (slotIndex < 0 || slotIndex >= this.slots.length) {
      return false;
    }
    
    // TODO: Get spell from registry and set cooldown
    // const spell = SpellRegistry.get(spellId);
    // if (!spell) return false;
    
    this.slots[slotIndex] = {
      spellId,
      currentCooldown: 0,
      maxCooldown: 500, // TODO: Get from spell data
    };
    
    return true;
  }
  
  /**
   * Unequip spell from a slot.
   */
  public unequipSpell(slotIndex: number): void {
    if (slotIndex >= 0 && slotIndex < this.slots.length) {
      this.slots[slotIndex].spellId = null;
    }
  }
  
  /**
   * Check if a slot can cast.
   */
  public canCast(slotIndex: number): boolean {
    if (slotIndex < 0 || slotIndex >= this.slots.length) {
      return false;
    }
    
    const slot = this.slots[slotIndex];
    return (
      slot.spellId !== null &&
      slot.currentCooldown <= 0 &&
      this.globalCooldown <= 0
    );
  }
  
  /**
   * Cast spell from a slot.
   * Returns the spell ID if successful, null otherwise.
   */
  public cast(slotIndex: number): string | null {
    if (!this.canCast(slotIndex)) {
      return null;
    }
    
    const slot = this.slots[slotIndex];
    const spellId = slot.spellId;
    
    // Start cooldowns
    slot.currentCooldown = slot.maxCooldown;
    this.globalCooldown = this.globalCooldownDuration;
    
    return spellId;
  }
  
  /**
   * Get spell ID in a slot.
   */
  public getSpellId(slotIndex: number): string | null {
    return this.slots[slotIndex]?.spellId ?? null;
  }
  
  /**
   * Get cooldown percent remaining (0-1).
   */
  public getCooldownPercent(slotIndex: number): number {
    const slot = this.slots[slotIndex];
    if (!slot || slot.maxCooldown === 0) return 0;
    return Math.max(0, slot.currentCooldown / slot.maxCooldown);
  }
  
  /**
   * Get remaining cooldown in ms.
   */
  public getCooldownRemaining(slotIndex: number): number {
    return Math.max(0, this.slots[slotIndex]?.currentCooldown ?? 0);
  }
  
  /**
   * Set cast speed modifier.
   */
  public setCastSpeedModifier(modifier: number): void {
    this.castSpeedModifier = modifier;
  }
  
  /**
   * Reset all cooldowns (for room clear rewards, etc).
   */
  public resetAllCooldowns(): void {
    this.globalCooldown = 0;
    for (const slot of this.slots) {
      slot.currentCooldown = 0;
    }
  }
  
  /**
   * Get number of slots.
   */
  public getSlotCount(): number {
    return this.slots.length;
  }
}
