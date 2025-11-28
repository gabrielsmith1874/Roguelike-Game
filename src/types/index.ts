/**
 * @file index.ts
 * @description Central type exports.
 * 
 * Add shared types here as the project grows.
 */

/**
 * 2D position.
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * 2D size.
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * Rectangle bounds.
 */
export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Direction enum for 4-directional movement.
 */
export enum Direction {
  NONE = 'none',
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right',
}

/**
 * 8-directional movement.
 */
export enum Direction8 {
  NONE = 'none',
  N = 'n',
  NE = 'ne',
  E = 'e',
  SE = 'se',
  S = 's',
  SW = 'sw',
  W = 'w',
  NW = 'nw',
}

/**
 * Generic callback type.
 */
export type Callback<T = void> = () => T;

/**
 * Callback with single argument.
 */
export type Callback1<A, T = void> = (arg: A) => T;

/**
 * Make all properties optional recursively.
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Extract keys of a type that have values of a specific type.
 */
export type KeysOfType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];
