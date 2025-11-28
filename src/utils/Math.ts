/**
 * @file Math.ts
 * @description Math utilities for game calculations.
 */

/**
 * Clamp a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation between two values.
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Inverse lerp - get t value for a value between start and end.
 */
export function inverseLerp(start: number, end: number, value: number): number {
  if (start === end) return 0;
  return (value - start) / (end - start);
}

/**
 * Remap a value from one range to another.
 */
export function remap(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  const t = inverseLerp(inMin, inMax, value);
  return lerp(outMin, outMax, t);
}

/**
 * Smooth step interpolation (ease in/out).
 */
export function smoothStep(t: number): number {
  return t * t * (3 - 2 * t);
}

/**
 * Smoother step interpolation.
 */
export function smootherStep(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/**
 * Convert degrees to radians.
 */
export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees.
 */
export function radToDeg(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Normalize an angle to 0-360 degrees.
 */
export function normalizeAngle(degrees: number): number {
  degrees = degrees % 360;
  if (degrees < 0) degrees += 360;
  return degrees;
}

/**
 * Get the shortest angle difference between two angles (in degrees).
 */
export function angleDifference(from: number, to: number): number {
  let diff = normalizeAngle(to - from);
  if (diff > 180) diff -= 360;
  return diff;
}

/**
 * Rotate angle towards target by max amount.
 */
export function rotateTowards(
  current: number,
  target: number,
  maxDelta: number
): number {
  const diff = angleDifference(current, target);
  if (Math.abs(diff) <= maxDelta) {
    return target;
  }
  return current + Math.sign(diff) * maxDelta;
}

/**
 * Get distance between two points.
 */
export function distance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Get squared distance (faster than distance for comparisons).
 */
export function distanceSquared(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}

/**
 * Check if a point is within a circle.
 */
export function pointInCircle(
  px: number,
  py: number,
  cx: number,
  cy: number,
  radius: number
): boolean {
  return distanceSquared(px, py, cx, cy) <= radius * radius;
}

/**
 * Check if a point is within a rectangle.
 */
export function pointInRect(
  px: number,
  py: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): boolean {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

/**
 * Check if two circles overlap.
 */
export function circlesOverlap(
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number
): boolean {
  const totalRadius = r1 + r2;
  return distanceSquared(x1, y1, x2, y2) <= totalRadius * totalRadius;
}

/**
 * Get angle from one point to another (in radians).
 */
export function angleBetween(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
): number {
  return Math.atan2(toY - fromY, toX - fromX);
}

/**
 * Get direction vector from angle (radians).
 */
export function directionFromAngle(angle: number): { x: number; y: number } {
  return {
    x: Math.cos(angle),
    y: Math.sin(angle),
  };
}

/**
 * Round to a specific number of decimal places.
 */
export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Check if a number is approximately equal to another.
 */
export function approximately(
  a: number,
  b: number,
  epsilon: number = 0.0001
): boolean {
  return Math.abs(a - b) < epsilon;
}

/**
 * Move a value towards a target by a maximum delta.
 */
export function moveTowards(
  current: number,
  target: number,
  maxDelta: number
): number {
  if (Math.abs(target - current) <= maxDelta) {
    return target;
  }
  return current + Math.sign(target - current) * maxDelta;
}

/**
 * Exponential decay (for smooth following).
 */
export function expDecay(
  current: number,
  target: number,
  decay: number,
  deltaTime: number
): number {
  return target + (current - target) * Math.exp(-decay * deltaTime);
}
