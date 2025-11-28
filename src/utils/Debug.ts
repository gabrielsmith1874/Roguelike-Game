/**
 * @file Debug.ts
 * @description Debug utilities for development.
 */

import Phaser from 'phaser';

/**
 * Debug configuration.
 */
interface DebugConfig {
  enabled: boolean;
  showFPS: boolean;
  showEntityCount: boolean;
  showColliders: boolean;
  logEvents: boolean;
}

const defaultConfig: DebugConfig = {
  enabled: import.meta.env.DEV,
  showFPS: true,
  showEntityCount: true,
  showColliders: false,
  logEvents: false,
};

/**
 * Debug utilities.
 * Only active in development mode by default.
 */
export class Debug {
  private static config: DebugConfig = { ...defaultConfig };
  private static fpsText: Phaser.GameObjects.Text | null = null;
  private static infoText: Phaser.GameObjects.Text | null = null;
  
  /**
   * Initialize debug display on a scene.
   */
  public static init(scene: Phaser.Scene): void {
    if (!this.config.enabled) return;
    
    // FPS counter
    if (this.config.showFPS) {
      this.fpsText = scene.add.text(5, 5, '', {
        fontSize: '12px',
        color: '#00ff00',
        backgroundColor: '#000000aa',
        padding: { x: 4, y: 2 },
      })
        .setScrollFactor(0)
        .setDepth(1000);
    }
    
    // Info text
    this.infoText = scene.add.text(5, 25, '', {
      fontSize: '10px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 4, y: 2 },
    })
      .setScrollFactor(0)
      .setDepth(1000);
  }
  
  /**
   * Update debug display. Call each frame.
   */
  public static update(scene: Phaser.Scene, info?: Record<string, unknown>): void {
    if (!this.config.enabled) return;
    
    // Update FPS
    if (this.fpsText && this.config.showFPS) {
      const fps = Math.round(scene.game.loop.actualFps);
      this.fpsText.setText(`FPS: ${fps}`);
    }
    
    // Update info
    if (this.infoText && info) {
      const lines = Object.entries(info).map(([key, value]) => `${key}: ${value}`);
      this.infoText.setText(lines.join('\n'));
    }
  }
  
  /**
   * Log a debug message.
   */
  public static log(...args: unknown[]): void {
    if (!this.config.enabled) return;
    console.log('[DEBUG]', ...args);
  }
  
  /**
   * Log a warning.
   */
  public static warn(...args: unknown[]): void {
    if (!this.config.enabled) return;
    console.warn('[DEBUG]', ...args);
  }
  
  /**
   * Log an error.
   */
  public static error(...args: unknown[]): void {
    // Always log errors
    console.error('[ERROR]', ...args);
  }
  
  /**
   * Draw a debug circle.
   */
  public static drawCircle(
    scene: Phaser.Scene,
    x: number,
    y: number,
    radius: number,
    color: number = 0xff0000,
    alpha: number = 0.5
  ): Phaser.GameObjects.Arc | null {
    if (!this.config.enabled) return null;
    
    return scene.add.circle(x, y, radius, color, alpha)
      .setDepth(999);
  }
  
  /**
   * Draw a debug rectangle.
   */
  public static drawRect(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    color: number = 0xff0000,
    alpha: number = 0.5
  ): Phaser.GameObjects.Rectangle | null {
    if (!this.config.enabled) return null;
    
    return scene.add.rectangle(x, y, width, height, color, alpha)
      .setDepth(999);
  }
  
  /**
   * Draw a debug line.
   */
  public static drawLine(
    scene: Phaser.Scene,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: number = 0xff0000,
    lineWidth: number = 1
  ): Phaser.GameObjects.Line | null {
    if (!this.config.enabled) return null;
    
    return scene.add.line(0, 0, x1, y1, x2, y2, color)
      .setLineWidth(lineWidth)
      .setOrigin(0, 0)
      .setDepth(999);
  }
  
  /**
   * Draw a debug point.
   */
  public static drawPoint(
    scene: Phaser.Scene,
    x: number,
    y: number,
    size: number = 4,
    color: number = 0xff0000
  ): Phaser.GameObjects.Arc | null {
    return this.drawCircle(scene, x, y, size, color, 1);
  }
  
  /**
   * Draw debug text at a position.
   */
  public static drawText(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    color: string = '#ff0000'
  ): Phaser.GameObjects.Text | null {
    if (!this.config.enabled) return null;
    
    return scene.add.text(x, y, text, {
      fontSize: '10px',
      color,
    })
      .setDepth(999);
  }
  
  /**
   * Measure execution time of a function.
   */
  public static time<T>(label: string, fn: () => T): T {
    if (!this.config.enabled) return fn();
    
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    this.log(`${label}: ${(end - start).toFixed(2)}ms`);
    return result;
  }
  
  /**
   * Set debug configuration.
   */
  public static setConfig(config: Partial<DebugConfig>): void {
    Object.assign(this.config, config);
  }
  
  /**
   * Check if debug is enabled.
   */
  public static isEnabled(): boolean {
    return this.config.enabled;
  }
  
  /**
   * Enable/disable debug mode.
   */
  public static setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }
}
