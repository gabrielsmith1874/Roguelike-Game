/**
 * @file ElementInteractions.ts
 * @description Element vs element interactions (resistances, weaknesses, combos).
 */

import { MagicElement } from './Element';

/**
 * Damage multiplier from attacker element vs defender element.
 * 1.0 = normal, >1.0 = effective, <1.0 = resisted
 */
type ElementMatchup = {
  [attacker in MagicElement]: {
    [defender in MagicElement]: number;
  };
};

/**
 * Element effectiveness chart.
 * Customize this to create interesting tactical depth.
 */
const ELEMENT_MATCHUPS: ElementMatchup = {
  [MagicElement.FIRE]: {
    [MagicElement.FIRE]: 0.5,
    [MagicElement.ICE]: 1.5,
    [MagicElement.LIGHTNING]: 1.0,
    [MagicElement.EARTH]: 0.75,
    [MagicElement.ARCANE]: 1.0,
    [MagicElement.NATURE]: 1.5,
    [MagicElement.SHADOW]: 1.0,
    [MagicElement.LIGHT]: 1.0,
  },
  [MagicElement.ICE]: {
    [MagicElement.FIRE]: 0.5,
    [MagicElement.ICE]: 0.5,
    [MagicElement.LIGHTNING]: 1.0,
    [MagicElement.EARTH]: 1.5,
    [MagicElement.ARCANE]: 1.0,
    [MagicElement.NATURE]: 1.0,
    [MagicElement.SHADOW]: 1.0,
    [MagicElement.LIGHT]: 1.0,
  },
  [MagicElement.LIGHTNING]: {
    [MagicElement.FIRE]: 1.0,
    [MagicElement.ICE]: 1.25,
    [MagicElement.LIGHTNING]: 0.5,
    [MagicElement.EARTH]: 0.5,
    [MagicElement.ARCANE]: 1.0,
    [MagicElement.NATURE]: 1.0,
    [MagicElement.SHADOW]: 1.0,
    [MagicElement.LIGHT]: 1.0,
  },
  [MagicElement.EARTH]: {
    [MagicElement.FIRE]: 1.25,
    [MagicElement.ICE]: 0.75,
    [MagicElement.LIGHTNING]: 1.5,
    [MagicElement.EARTH]: 0.5,
    [MagicElement.ARCANE]: 1.0,
    [MagicElement.NATURE]: 0.75,
    [MagicElement.SHADOW]: 1.0,
    [MagicElement.LIGHT]: 1.0,
  },
  [MagicElement.ARCANE]: {
    [MagicElement.FIRE]: 1.0,
    [MagicElement.ICE]: 1.0,
    [MagicElement.LIGHTNING]: 1.0,
    [MagicElement.EARTH]: 1.0,
    [MagicElement.ARCANE]: 1.0,
    [MagicElement.NATURE]: 1.0,
    [MagicElement.SHADOW]: 1.0,
    [MagicElement.LIGHT]: 1.0,
  },
  [MagicElement.NATURE]: {
    [MagicElement.FIRE]: 0.5,
    [MagicElement.ICE]: 1.0,
    [MagicElement.LIGHTNING]: 1.0,
    [MagicElement.EARTH]: 1.25,
    [MagicElement.ARCANE]: 1.0,
    [MagicElement.NATURE]: 0.5,
    [MagicElement.SHADOW]: 1.25,
    [MagicElement.LIGHT]: 0.75,
  },
  [MagicElement.SHADOW]: {
    [MagicElement.FIRE]: 1.0,
    [MagicElement.ICE]: 1.0,
    [MagicElement.LIGHTNING]: 1.0,
    [MagicElement.EARTH]: 1.0,
    [MagicElement.ARCANE]: 1.0,
    [MagicElement.NATURE]: 0.75,
    [MagicElement.SHADOW]: 0.5,
    [MagicElement.LIGHT]: 0.5,
  },
  [MagicElement.LIGHT]: {
    [MagicElement.FIRE]: 1.0,
    [MagicElement.ICE]: 1.0,
    [MagicElement.LIGHTNING]: 1.0,
    [MagicElement.EARTH]: 1.0,
    [MagicElement.ARCANE]: 1.0,
    [MagicElement.NATURE]: 1.25,
    [MagicElement.SHADOW]: 1.5,
    [MagicElement.LIGHT]: 0.5,
  },
};

/**
 * Get damage multiplier for element matchup.
 */
export function getElementMultiplier(
  attacker: MagicElement,
  defender: MagicElement
): number {
  return ELEMENT_MATCHUPS[attacker][defender];
}

/**
 * Element combo effects.
 * When two elements combine, they create special effects.
 */
export interface ElementCombo {
  elements: [MagicElement, MagicElement];
  name: string;
  effect: string;
  damageMultiplier: number;
}

/**
 * Defined element combos.
 */
const ELEMENT_COMBOS: ElementCombo[] = [
  {
    elements: [MagicElement.FIRE, MagicElement.ICE],
    name: 'Steam Explosion',
    effect: 'Creates a steam cloud that damages and blinds',
    damageMultiplier: 1.5,
  },
  {
    elements: [MagicElement.LIGHTNING, MagicElement.ICE],
    name: 'Shatter',
    effect: 'Frozen enemies take massive damage',
    damageMultiplier: 2.0,
  },
  {
    elements: [MagicElement.FIRE, MagicElement.EARTH],
    name: 'Magma',
    effect: 'Creates burning ground hazard',
    damageMultiplier: 1.25,
  },
  {
    elements: [MagicElement.LIGHTNING, MagicElement.NATURE],
    name: 'Overgrowth',
    effect: 'Roots spread and electrify',
    damageMultiplier: 1.5,
  },
  {
    elements: [MagicElement.SHADOW, MagicElement.LIGHT],
    name: 'Annihilation',
    effect: 'Pure destructive energy',
    damageMultiplier: 2.0,
  },
];

/**
 * Find a combo for two elements.
 */
export function findElementCombo(
  element1: MagicElement,
  element2: MagicElement
): ElementCombo | undefined {
  return ELEMENT_COMBOS.find(
    (combo) =>
      (combo.elements[0] === element1 && combo.elements[1] === element2) ||
      (combo.elements[0] === element2 && combo.elements[1] === element1)
  );
}

/**
 * Check if two elements can combo.
 */
export function canCombo(
  element1: MagicElement,
  element2: MagicElement
): boolean {
  return findElementCombo(element1, element2) !== undefined;
}
