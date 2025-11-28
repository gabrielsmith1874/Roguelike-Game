/**
 * @file GameManager.ts
 * @description Central game state management.
 */

import { EventManager } from './EventManager';
import { SaveManager } from './SaveManager';
import { EVENTS } from '@config/Constants';

/**
 * Game state enum.
 */
export enum GameState {
  MENU = 'menu',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'game_over',
  VICTORY = 'victory',
}

/**
 * Current run statistics.
 */
export interface RunStats {
  startTime: number;
  currentFloor: number;
  roomsCleared: number;
  enemiesKilled: number;
  damageDealt: number;
  damageTaken: number;
  spellsCast: number;
  itemsCollected: number;
  goldCollected: number;
}

/**
 * Game Manager - central hub for game state.
 * 
 * Responsibilities:
 * - Track game state (menu, playing, paused, etc.)
 * - Manage current run statistics
 * - Coordinate between systems
 */
export class GameManager {
  private static instance: GameManager;
  
  private state: GameState = GameState.MENU;
  private events: EventManager;
  private saves: SaveManager;
  
  private runStats: RunStats = this.createEmptyStats();
  private isPaused: boolean = false;
  
  private constructor() {
    this.events = EventManager.getInstance();
    this.saves = SaveManager.getInstance();
    
    this.setupEventListeners();
  }
  
  /**
   * Get the singleton instance.
   */
  public static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }
  
  /**
   * Create empty run stats.
   */
  private createEmptyStats(): RunStats {
    return {
      startTime: 0,
      currentFloor: 0,
      roomsCleared: 0,
      enemiesKilled: 0,
      damageDealt: 0,
      damageTaken: 0,
      spellsCast: 0,
      itemsCollected: 0,
      goldCollected: 0,
    };
  }
  
  /**
   * Set up event listeners.
   */
  private setupEventListeners(): void {
    this.events.on(EVENTS.ENEMY_KILLED, this.onEnemyKilled, this);
    this.events.on(EVENTS.ROOM_CLEARED, this.onRoomCleared, this);
    this.events.on(EVENTS.FLOOR_COMPLETED, this.onFloorCompleted, this);
    this.events.on(EVENTS.PLAYER_DAMAGED, this.onPlayerDamaged, this);
    this.events.on(EVENTS.SPELL_CAST, this.onSpellCast, this);
    this.events.on(EVENTS.ITEM_PICKED_UP, this.onItemPickedUp, this);
  }
  
  /**
   * Start a new run.
   */
  public startNewRun(): void {
    this.runStats = this.createEmptyStats();
    this.runStats.startTime = Date.now();
    this.runStats.currentFloor = 1;
    
    this.state = GameState.PLAYING;
    this.isPaused = false;
    
    this.saves.startNewRun();
  }
  
  /**
   * Continue existing run (if any).
   */
  public continueRun(): boolean {
    if (!this.saves.hasRunInProgress()) {
      return false;
    }
    
    const saveData = this.saves.getData();
    this.runStats = {
      ...this.createEmptyStats(),
      ...saveData.run.stats,
      currentFloor: saveData.run.currentFloor,
    };
    
    this.state = GameState.PLAYING;
    this.isPaused = false;
    
    return true;
  }
  
  /**
   * End the current run.
   */
  public endRun(victory: boolean): void {
    this.state = victory ? GameState.VICTORY : GameState.GAME_OVER;
    
    // Save final stats
    this.saves.updateRun({
      stats: {
        kills: this.runStats.enemiesKilled,
        damageDealt: this.runStats.damageDealt,
        damageTaken: this.runStats.damageTaken,
        spellsCast: this.runStats.spellsCast,
        roomsCleared: this.runStats.roomsCleared,
        timePlayed: Date.now() - this.runStats.startTime,
      },
    });
    
    this.saves.endRun(victory);
  }
  
  /**
   * Pause the game.
   */
  public pause(): void {
    if (this.state !== GameState.PLAYING) return;
    
    this.isPaused = true;
    this.state = GameState.PAUSED;
    this.events.emit(EVENTS.GAME_PAUSED);
  }
  
  /**
   * Resume the game.
   */
  public resume(): void {
    if (this.state !== GameState.PAUSED) return;
    
    this.isPaused = false;
    this.state = GameState.PLAYING;
    this.events.emit(EVENTS.GAME_RESUMED);
  }
  
  /**
   * Return to main menu.
   */
  public returnToMenu(): void {
    this.state = GameState.MENU;
    this.isPaused = false;
    
    // Auto-save if run in progress
    if (this.saves.hasRunInProgress()) {
      this.saves.save();
    }
  }
  
  /**
   * Get current game state.
   */
  public getState(): GameState {
    return this.state;
  }
  
  /**
   * Check if game is paused.
   */
  public getIsPaused(): boolean {
    return this.isPaused;
  }
  
  /**
   * Get current run stats.
   */
  public getRunStats(): Readonly<RunStats> {
    return this.runStats;
  }
  
  /**
   * Get time played in current run (ms).
   */
  public getTimePlayed(): number {
    if (this.runStats.startTime === 0) return 0;
    return Date.now() - this.runStats.startTime;
  }
  
  // Event handlers
  
  private onEnemyKilled(): void {
    this.runStats.enemiesKilled++;
  }
  
  private onRoomCleared(): void {
    this.runStats.roomsCleared++;
  }
  
  private onFloorCompleted(): void {
    this.runStats.currentFloor++;
    this.saves.updateRun({ currentFloor: this.runStats.currentFloor });
  }
  
  private onPlayerDamaged(data: { amount: number }): void {
    this.runStats.damageTaken += data.amount;
  }
  
  private onSpellCast(): void {
    this.runStats.spellsCast++;
  }
  
  private onItemPickedUp(data: { value?: number }): void {
    this.runStats.itemsCollected++;
    if (data.value) {
      this.runStats.goldCollected += data.value;
    }
  }
}
