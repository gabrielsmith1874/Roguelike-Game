/**
 * @file ObjectPool.ts
 * @description Object pooling for performance-critical reusable objects.
 */

/**
 * Interface for poolable objects.
 */
export interface Poolable {
  /** Reset object for reuse */
  reset(...args: unknown[]): void;
  /** Deactivate object (return to pool) */
  deactivate(): void;
  /** Check if object is currently active */
  isActive(): boolean;
}

/**
 * Generic object pool for reusing objects.
 * 
 * Use this for frequently created/destroyed objects like:
 * - Projectiles
 * - Particles
 * - Damage numbers
 * - Sound effect instances
 * 
 * @example
 * ```ts
 * // Create pool
 * const projectilePool = new ObjectPool(
 *   () => new Projectile(scene, config),
 *   100
 * );
 * 
 * // Get object from pool
 * const proj = projectilePool.get();
 * proj.reset(x, y, direction);
 * 
 * // Return to pool (call deactivate on the object)
 * proj.deactivate();
 * ```
 */
export class ObjectPool<T extends Poolable> {
  private pool: T[] = [];
  private factory: () => T;
  private maxSize: number;
  private activeCount: number = 0;
  
  constructor(factory: () => T, initialSize: number = 10, maxSize: number = 100) {
    this.factory = factory;
    this.maxSize = maxSize;
    
    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      const obj = this.factory();
      obj.deactivate();
      this.pool.push(obj);
    }
  }
  
  /**
   * Get an object from the pool.
   * Creates a new one if pool is empty and under max size.
   */
  public get(): T | null {
    // Find inactive object in pool
    for (const obj of this.pool) {
      if (!obj.isActive()) {
        this.activeCount++;
        return obj;
      }
    }
    
    // Create new if under max
    if (this.pool.length < this.maxSize) {
      const obj = this.factory();
      this.pool.push(obj);
      this.activeCount++;
      return obj;
    }
    
    // Pool exhausted
    console.warn('Object pool exhausted');
    return null;
  }
  
  /**
   * Return an object to the pool.
   * The object should call deactivate() on itself.
   */
  public release(obj: T): void {
    if (this.pool.includes(obj)) {
      obj.deactivate();
      this.activeCount--;
    }
  }
  
  /**
   * Get all active objects.
   */
  public getActive(): T[] {
    return this.pool.filter((obj) => obj.isActive());
  }
  
  /**
   * Get count of active objects.
   */
  public getActiveCount(): number {
    return this.activeCount;
  }
  
  /**
   * Get total pool size.
   */
  public getSize(): number {
    return this.pool.length;
  }
  
  /**
   * Deactivate all objects.
   */
  public releaseAll(): void {
    for (const obj of this.pool) {
      if (obj.isActive()) {
        obj.deactivate();
      }
    }
    this.activeCount = 0;
  }
  
  /**
   * Clear the pool.
   */
  public clear(): void {
    this.releaseAll();
    this.pool = [];
  }
  
  /**
   * Run a function on all active objects.
   */
  public forEachActive(callback: (obj: T) => void): void {
    for (const obj of this.pool) {
      if (obj.isActive()) {
        callback(obj);
      }
    }
  }
}
