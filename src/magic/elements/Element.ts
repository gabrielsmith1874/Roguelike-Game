/**
 * @file Element.ts
 * @description Magic element definitions and properties.
 */

/**
 * Magic element types.
 * Extend this enum as you add more elements.
 */
export enum MagicElement {
  FIRE = 'fire',
  ICE = 'ice',
  LIGHTNING = 'lightning',
  EARTH = 'earth',
  ARCANE = 'arcane',
  NATURE = 'nature',
  SHADOW = 'shadow',
  LIGHT = 'light',
}

/**
 * Element properties for visual and gameplay effects.
 */
export interface ElementProperties {
  name: string;
  color: number; // Hex color
  secondaryColor: number;
  description: string;
  
  // Gameplay modifiers
  statusEffect?: string; // Primary status effect caused
  critModifier?: number; // Crit chance modifier
  damageType?: 'direct' | 'dot' | 'burst';
}

/**
 * Element property definitions.
 */
export const ELEMENT_PROPERTIES: Record<MagicElement, ElementProperties> = {
  [MagicElement.FIRE]: {
    name: 'Fire',
    color: 0xff4400,
    secondaryColor: 0xffaa00,
    description: 'Burns enemies over time',
    statusEffect: 'burning',
    damageType: 'dot',
  },
  
  [MagicElement.ICE]: {
    name: 'Ice',
    color: 0x44ccff,
    secondaryColor: 0xffffff,
    description: 'Slows and freezes enemies',
    statusEffect: 'frozen',
    damageType: 'direct',
  },
  
  [MagicElement.LIGHTNING]: {
    name: 'Lightning',
    color: 0xffff44,
    secondaryColor: 0xffffff,
    description: 'High crit chance, chains to nearby enemies',
    statusEffect: 'shocked',
    critModifier: 1.5,
    damageType: 'burst',
  },
  
  [MagicElement.EARTH]: {
    name: 'Earth',
    color: 0x885533,
    secondaryColor: 0xaa8844,
    description: 'High damage, can stun',
    statusEffect: 'stunned',
    damageType: 'direct',
  },
  
  [MagicElement.ARCANE]: {
    name: 'Arcane',
    color: 0xaa44ff,
    secondaryColor: 0xdd88ff,
    description: 'Pure magical damage, ignores resistances',
    damageType: 'direct',
  },
  
  [MagicElement.NATURE]: {
    name: 'Nature',
    color: 0x44ff44,
    secondaryColor: 0x88ff88,
    description: 'Heals or poisons',
    statusEffect: 'poisoned',
    damageType: 'dot',
  },
  
  [MagicElement.SHADOW]: {
    name: 'Shadow',
    color: 0x442266,
    secondaryColor: 0x884488,
    description: 'Weakens enemies',
    statusEffect: 'weakened',
    damageType: 'direct',
  },
  
  [MagicElement.LIGHT]: {
    name: 'Light',
    color: 0xffffaa,
    secondaryColor: 0xffffff,
    description: 'Extra damage to undead, can blind',
    statusEffect: 'blinded',
    damageType: 'burst',
  },
};

/**
 * Get element properties.
 */
export function getElementProperties(element: MagicElement): ElementProperties {
  return ELEMENT_PROPERTIES[element];
}

/**
 * Get element color.
 */
export function getElementColor(element: MagicElement): number {
  return ELEMENT_PROPERTIES[element].color;
}
