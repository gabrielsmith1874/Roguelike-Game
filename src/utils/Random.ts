/**
 * @file Random.ts
 * @description Seeded random number generator for reproducible procedural generation.
 */

/**
 * Seeded random number generator using xorshift128+.
 * Produces reproducible sequences given the same seed.
 * 
 * @example
 * ```ts
 * const rng = new SeededRandom(12345);
 * const value = rng.next(); // 0-1
 * const int = rng.intBetween(1, 10); // 1-10 inclusive
 * const item = rng.pick(['a', 'b', 'c']); // Random element
 * ```
 */
export class SeededRandom {
  private state: [number, number, number, number];
  
  constructor(seed: number = Date.now()) {
    // Initialize state from seed using splitmix64
    this.state = [0, 0, 0, 0];
    this.setSeed(seed);
  }
  
  /**
   * Set the seed and reset state.
   */
  public setSeed(seed: number): void {
    // SplitMix64 to initialize state
    let s = seed;
    for (let i = 0; i < 4; i++) {
      s = (s + 0x9e3779b97f4a7c15) | 0;
      let z = s;
      z = (z ^ (z >>> 30)) * 0xbf58476d1ce4e5b9;
      z = (z ^ (z >>> 27)) * 0x94d049bb133111eb;
      z = z ^ (z >>> 31);
      this.state[i] = z >>> 0;
    }
  }
  
  /**
   * Get the next random number (0-1).
   */
  public next(): number {
    // xorshift128+
    const s0 = this.state[0];
    let s1 = this.state[1];
    const s2 = this.state[2];
    let s3 = this.state[3];
    
    const result = (s0 + s3) >>> 0;
    
    s1 ^= s0;
    s3 ^= s2;
    
    this.state[0] = (((s0 << 24) | (s0 >>> 8)) ^ s1 ^ (s1 << 16)) >>> 0;
    this.state[1] = ((s1 << 17) | (s1 >>> 15)) >>> 0;
    this.state[2] = (((s2 << 19) | (s2 >>> 13)) ^ s3 ^ (s3 << 21)) >>> 0;
    this.state[3] = ((s3 << 5) | (s3 >>> 27)) >>> 0;
    
    return result / 0x100000000;
  }
  
  /**
   * Get a random integer between min and max (inclusive).
   */
  public intBetween(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  
  /**
   * Get a random float between min and max.
   */
  public floatBetween(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }
  
  /**
   * Get a random boolean with given probability of true.
   */
  public chance(probability: number = 0.5): boolean {
    return this.next() < probability;
  }
  
  /**
   * Pick a random element from an array.
   */
  public pick<T>(array: T[]): T {
    return array[this.intBetween(0, array.length - 1)];
  }
  
  /**
   * Pick multiple unique random elements from an array.
   */
  public pickMultiple<T>(array: T[], count: number): T[] {
    const shuffled = this.shuffle([...array]);
    return shuffled.slice(0, Math.min(count, array.length));
  }
  
  /**
   * Shuffle an array in place using Fisher-Yates.
   */
  public shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.intBetween(0, i);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  
  /**
   * Pick a weighted random element.
   */
  public weightedPick<T>(items: T[], weights: number[]): T {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = this.next() * totalWeight;
    
    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return items[i];
      }
    }
    
    return items[items.length - 1];
  }
  
  /**
   * Get a random point in a circle.
   */
  public pointInCircle(centerX: number, centerY: number, radius: number): { x: number; y: number } {
    const angle = this.next() * Math.PI * 2;
    const r = Math.sqrt(this.next()) * radius;
    return {
      x: centerX + Math.cos(angle) * r,
      y: centerY + Math.sin(angle) * r,
    };
  }
  
  /**
   * Get a random point on a circle's edge.
   */
  public pointOnCircle(centerX: number, centerY: number, radius: number): { x: number; y: number } {
    const angle = this.next() * Math.PI * 2;
    return {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    };
  }
  
  /**
   * Clone this RNG with current state.
   */
  public clone(): SeededRandom {
    const clone = new SeededRandom(0);
    clone.state = [...this.state] as [number, number, number, number];
    return clone;
  }
}

/**
 * Global non-seeded random utilities.
 * Use SeededRandom for anything that needs to be reproducible.
 */
export const Random = {
  /**
   * Random float 0-1.
   */
  next(): number {
    return Math.random();
  },
  
  /**
   * Random integer between min and max (inclusive).
   */
  intBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  
  /**
   * Random boolean.
   */
  chance(probability: number = 0.5): boolean {
    return Math.random() < probability;
  },
  
  /**
   * Pick random element.
   */
  pick<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  },
  
  /**
   * Shuffle array.
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  },
};
