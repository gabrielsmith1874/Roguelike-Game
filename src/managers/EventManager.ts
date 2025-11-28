/**
 * @file EventManager.ts
 * @description Global event bus for cross-system communication.
 */

type EventCallback = (...args: unknown[]) => void;

/**
 * Event Manager - global event bus.
 * Use this for communication between unrelated systems.
 * 
 * Prefer direct method calls when objects have references to each other.
 * Use events for loose coupling between systems.
 * 
 * @example
 * ```ts
 * // Subscribe
 * EventManager.getInstance().on('player:died', this.onPlayerDeath, this);
 * 
 * // Emit
 * EventManager.getInstance().emit('player:died', { player });
 * 
 * // Unsubscribe (important for cleanup!)
 * EventManager.getInstance().off('player:died', this.onPlayerDeath, this);
 * ```
 */
export class EventManager {
  private static instance: EventManager;
  
  private listeners: Map<string, Array<{ callback: EventCallback; context?: object }>>;
  
  private constructor() {
    this.listeners = new Map();
  }
  
  /**
   * Get the singleton instance.
   */
  public static getInstance(): EventManager {
    if (!EventManager.instance) {
      EventManager.instance = new EventManager();
    }
    return EventManager.instance;
  }
  
  /**
   * Subscribe to an event.
   */
  public on(event: string, callback: EventCallback, context?: object): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push({ callback, context });
  }
  
  /**
   * Subscribe to an event once (auto-removes after first call).
   */
  public once(event: string, callback: EventCallback, context?: object): void {
    const wrapper = (...args: unknown[]) => {
      this.off(event, wrapper);
      callback.apply(context, args);
    };
    this.on(event, wrapper, context);
  }
  
  /**
   * Unsubscribe from an event.
   */
  public off(event: string, callback: EventCallback, context?: object): void {
    const listeners = this.listeners.get(event);
    if (!listeners) return;
    
    const index = listeners.findIndex(
      (l) => l.callback === callback && l.context === context
    );
    
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }
  
  /**
   * Emit an event with data.
   */
  public emit(event: string, ...args: unknown[]): void {
    const listeners = this.listeners.get(event);
    if (!listeners) return;
    
    // Copy array to prevent issues if listeners modify the array
    const copy = [...listeners];
    for (const { callback, context } of copy) {
      callback.apply(context, args);
    }
  }
  
  /**
   * Remove all listeners for an event.
   */
  public removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
  
  /**
   * Check if an event has listeners.
   */
  public hasListeners(event: string): boolean {
    const listeners = this.listeners.get(event);
    return listeners !== undefined && listeners.length > 0;
  }
  
  /**
   * Get listener count for an event.
   */
  public listenerCount(event: string): number {
    return this.listeners.get(event)?.length ?? 0;
  }
}
