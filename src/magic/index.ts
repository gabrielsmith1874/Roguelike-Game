/**
 * @file index.ts
 * @description Magic system exports.
 */

export { Spell, SpellTargetType, SpellRarity } from './Spell';
export type { SpellData } from './Spell';

export { SpellFactory } from './SpellFactory';
export { SpellRegistry } from './SpellRegistry';

export { MagicElement, ELEMENT_PROPERTIES, getElementProperties, getElementColor } from './elements/Element';
export type { ElementProperties } from './elements/Element';

export { getElementMultiplier, findElementCombo, canCombo } from './elements/ElementInteractions';
export type { ElementCombo } from './elements/ElementInteractions';

export { Effect, ParticleBurstEffect } from './effects/Effect';
export { StatusEffect, StatusEffectType, StatusEffectManager } from './effects/StatusEffect';
export type { StatusEffectData } from './effects/StatusEffect';
