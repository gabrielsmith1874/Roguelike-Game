/**
 * @file InputManager.ts
 * @description Centralized input handling for keyboard and mouse/gamepad.
 */

import Phaser from 'phaser';

/**
 * Input actions - abstract input names from physical keys.
 * This allows key remapping without changing game code.
 */
export enum InputAction {
  MOVE_UP = 'move_up',
  MOVE_DOWN = 'move_down',
  MOVE_LEFT = 'move_left',
  MOVE_RIGHT = 'move_right',
  SPELL_1 = 'spell_1',
  SPELL_2 = 'spell_2',
  SPELL_3 = 'spell_3',
  SPELL_4 = 'spell_4',
  DODGE = 'dodge',
  INTERACT = 'interact',
  PAUSE = 'pause',
  MAP = 'map',
}

/**
 * Default key bindings.
 */
const DEFAULT_BINDINGS: Record<InputAction, number[]> = {
  [InputAction.MOVE_UP]: [Phaser.Input.Keyboard.KeyCodes.W, Phaser.Input.Keyboard.KeyCodes.UP],
  [InputAction.MOVE_DOWN]: [Phaser.Input.Keyboard.KeyCodes.S, Phaser.Input.Keyboard.KeyCodes.DOWN],
  [InputAction.MOVE_LEFT]: [Phaser.Input.Keyboard.KeyCodes.A, Phaser.Input.Keyboard.KeyCodes.LEFT],
  [InputAction.MOVE_RIGHT]: [Phaser.Input.Keyboard.KeyCodes.D, Phaser.Input.Keyboard.KeyCodes.RIGHT],
  [InputAction.SPELL_1]: [Phaser.Input.Keyboard.KeyCodes.ONE],
  [InputAction.SPELL_2]: [Phaser.Input.Keyboard.KeyCodes.TWO],
  [InputAction.SPELL_3]: [Phaser.Input.Keyboard.KeyCodes.THREE],
  [InputAction.SPELL_4]: [Phaser.Input.Keyboard.KeyCodes.FOUR],
  [InputAction.DODGE]: [Phaser.Input.Keyboard.KeyCodes.SPACE, Phaser.Input.Keyboard.KeyCodes.SHIFT],
  [InputAction.INTERACT]: [Phaser.Input.Keyboard.KeyCodes.E, Phaser.Input.Keyboard.KeyCodes.F],
  [InputAction.PAUSE]: [Phaser.Input.Keyboard.KeyCodes.ESC, Phaser.Input.Keyboard.KeyCodes.P],
  [InputAction.MAP]: [Phaser.Input.Keyboard.KeyCodes.M, Phaser.Input.Keyboard.KeyCodes.TAB],
};

/**
 * Input Manager - centralized input handling.
 * 
 * Features:
 * - Action-based input (not key-based)
 * - Key remapping support
 * - Mouse position tracking
 * - Gamepad support (TODO)
 */
export class InputManager {
  private scene: Phaser.Scene;
  private bindings: Record<InputAction, number[]>;
  private keys: Map<number, Phaser.Input.Keyboard.Key> = new Map();
  
  // Action states
  private actionStates: Map<InputAction, boolean> = new Map();
  private previousStates: Map<InputAction, boolean> = new Map();
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.bindings = { ...DEFAULT_BINDINGS };
    
    this.initializeKeys();
  }
  
  /**
   * Initialize keyboard keys.
   */
  private initializeKeys(): void {
    if (!this.scene.input.keyboard) return;
    
    // Collect all unique key codes
    const keyCodes = new Set<number>();
    for (const codes of Object.values(this.bindings)) {
      for (const code of codes) {
        keyCodes.add(code);
      }
    }
    
    // Create key objects
    for (const code of keyCodes) {
      const key = this.scene.input.keyboard.addKey(code);
      this.keys.set(code, key);
    }
    
    // Initialize action states
    for (const action of Object.values(InputAction)) {
      this.actionStates.set(action, false);
      this.previousStates.set(action, false);
    }
  }
  
  /**
   * Update input states. Call this each frame.
   */
  public update(): void {
    // Store previous states
    for (const [action, state] of this.actionStates) {
      this.previousStates.set(action, state);
    }
    
    // Update current states
    for (const action of Object.values(InputAction)) {
      const keyCodes = this.bindings[action];
      let isDown = false;
      
      for (const code of keyCodes) {
        const key = this.keys.get(code);
        if (key?.isDown) {
          isDown = true;
          break;
        }
      }
      
      this.actionStates.set(action, isDown);
    }
  }
  
  /**
   * Check if an action is currently held down.
   */
  public isDown(action: InputAction): boolean {
    return this.actionStates.get(action) ?? false;
  }
  
  /**
   * Check if an action was just pressed this frame.
   */
  public justPressed(action: InputAction): boolean {
    const current = this.actionStates.get(action) ?? false;
    const previous = this.previousStates.get(action) ?? false;
    return current && !previous;
  }
  
  /**
   * Check if an action was just released this frame.
   */
  public justReleased(action: InputAction): boolean {
    const current = this.actionStates.get(action) ?? false;
    const previous = this.previousStates.get(action) ?? false;
    return !current && previous;
  }
  
  /**
   * Get movement vector from input.
   */
  public getMovementVector(): Phaser.Math.Vector2 {
    const vector = new Phaser.Math.Vector2(0, 0);
    
    if (this.isDown(InputAction.MOVE_UP)) vector.y -= 1;
    if (this.isDown(InputAction.MOVE_DOWN)) vector.y += 1;
    if (this.isDown(InputAction.MOVE_LEFT)) vector.x -= 1;
    if (this.isDown(InputAction.MOVE_RIGHT)) vector.x += 1;
    
    return vector;
  }
  
  /**
   * Get mouse position in world coordinates.
   */
  public getMouseWorldPosition(): Phaser.Math.Vector2 {
    const pointer = this.scene.input.activePointer;
    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    return new Phaser.Math.Vector2(worldPoint.x, worldPoint.y);
  }
  
  /**
   * Get mouse position in screen coordinates.
   */
  public getMouseScreenPosition(): Phaser.Math.Vector2 {
    const pointer = this.scene.input.activePointer;
    return new Phaser.Math.Vector2(pointer.x, pointer.y);
  }
  
  /**
   * Check if left mouse button is down.
   */
  public isMouseDown(): boolean {
    return this.scene.input.activePointer.isDown;
  }
  
  /**
   * Check if left mouse button was just pressed.
   */
  public isMouseJustPressed(): boolean {
    return this.scene.input.activePointer.justDown;
  }
  
  /**
   * Check if right mouse button is down.
   */
  public isRightMouseDown(): boolean {
    return this.scene.input.activePointer.rightButtonDown();
  }
  
  /**
   * Rebind an action to new keys.
   */
  public rebind(action: InputAction, keyCodes: number[]): void {
    // Remove old keys
    const oldCodes = this.bindings[action];
    for (const code of oldCodes) {
      // Only remove if not used by other actions
      let usedElsewhere = false;
      for (const [otherAction, codes] of Object.entries(this.bindings)) {
        if (otherAction !== action && codes.includes(code)) {
          usedElsewhere = true;
          break;
        }
      }
      if (!usedElsewhere) {
        this.keys.delete(code);
      }
    }
    
    // Add new keys
    this.bindings[action] = keyCodes;
    for (const code of keyCodes) {
      if (!this.keys.has(code) && this.scene.input.keyboard) {
        const key = this.scene.input.keyboard.addKey(code);
        this.keys.set(code, key);
      }
    }
  }
  
  /**
   * Get current bindings for an action.
   */
  public getBindings(action: InputAction): number[] {
    return [...this.bindings[action]];
  }
  
  /**
   * Reset bindings to defaults.
   */
  public resetBindings(): void {
    this.bindings = { ...DEFAULT_BINDINGS };
    this.initializeKeys();
  }
}
