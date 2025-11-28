/**
 * @file SpellFactory.ts
 * @description Factory for creating spell instances.
 */

import Phaser from 'phaser';
import { Spell, SpellData, SpellTargetType } from './Spell';
import { SpellRegistry } from './SpellRegistry';

// Import spell implementations when created
// import { ProjectileSpell } from './spells/ProjectileSpell';
// import { AOESpell } from './spells/AOESpell';
// import { SelfSpell } from './spells/SelfSpell';

/**
 * Placeholder spell implementation until specific types are created.
 */
class PlaceholderSpell extends Spell {
  public cast(): void {
    console.warn(`Spell ${this.data.id} cast (placeholder)`);
  }
}

/**
 * Factory for creating spell instances from data.
 * 
 * @example
 * ```ts
 * const fireball = SpellFactory.create(scene, 'fireball');
 * fireball.cast(player, mouseX, mouseY);
 * ```
 */
export class SpellFactory {
  /**
   * Create a spell instance from ID.
   */
  public static create(scene: Phaser.Scene, spellId: string): Spell | null {
    const data = SpellRegistry.get(spellId);
    if (!data) {
      console.error(`Spell not found: ${spellId}`);
      return null;
    }
    
    return this.createFromData(scene, data);
  }
  
  /**
   * Create a spell instance from data.
   */
  public static createFromData(scene: Phaser.Scene, data: SpellData): Spell {
    switch (data.targetType) {
      case SpellTargetType.PROJECTILE:
        // TODO: return new ProjectileSpell(scene, data);
        return new PlaceholderSpell(scene, data);
        
      case SpellTargetType.SELF_AOE:
      case SpellTargetType.TARGET_AOE:
        // TODO: return new AOESpell(scene, data);
        return new PlaceholderSpell(scene, data);
        
      case SpellTargetType.SELF:
        // TODO: return new SelfSpell(scene, data);
        return new PlaceholderSpell(scene, data);
        
      case SpellTargetType.ZONE:
        // TODO: return new ZoneSpell(scene, data);
        return new PlaceholderSpell(scene, data);
        
      case SpellTargetType.BEAM:
        // TODO: return new BeamSpell(scene, data);
        return new PlaceholderSpell(scene, data);
        
      case SpellTargetType.SUMMON:
        // TODO: return new SummonSpell(scene, data);
        return new PlaceholderSpell(scene, data);
        
      default:
        console.warn(`Unknown spell type: ${data.targetType}`);
        return new PlaceholderSpell(scene, data);
    }
  }
  
  /**
   * Create multiple spells by ID.
   */
  public static createMultiple(
    scene: Phaser.Scene,
    spellIds: string[]
  ): Spell[] {
    return spellIds
      .map((id) => this.create(scene, id))
      .filter((spell): spell is Spell => spell !== null);
  }
}
