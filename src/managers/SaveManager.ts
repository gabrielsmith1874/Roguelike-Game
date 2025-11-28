/**
 * @file SaveManager.ts
 * @description Save/load system for game progress.
 */

const SAVE_KEY_PREFIX = 'arcane_depths_';
const CURRENT_SAVE_VERSION = 1;

/**
 * Save data structure.
 * Extend this as you add more persistent data.
 */
export interface SaveData {
  version: number;
  timestamp: number;
  
  // Meta-progression (persists across runs)
  meta: {
    totalRuns: number;
    totalDeaths: number;
    totalKills: number;
    totalFloorsCleared: number;
    highestFloor: number;
    unlockedSpells: string[];
    unlockedCharacters: string[];
    achievements: string[];
  };
  
  // Current run (cleared on death)
  run: {
    inProgress: boolean;
    seed: number;
    currentFloor: number;
    playerHealth: number;
    playerMaxHealth: number;
    playerMana: number;
    playerMaxMana: number;
    equippedSpells: string[];
    inventory: string[];
    gold: number;
    stats: {
      kills: number;
      damageDealt: number;
      damageTaken: number;
      spellsCast: number;
      roomsCleared: number;
      timePlayed: number;
    };
  };
}

/**
 * Default save data.
 */
const DEFAULT_SAVE_DATA: SaveData = {
  version: CURRENT_SAVE_VERSION,
  timestamp: 0,
  meta: {
    totalRuns: 0,
    totalDeaths: 0,
    totalKills: 0,
    totalFloorsCleared: 0,
    highestFloor: 0,
    unlockedSpells: ['fireball', 'ice_shard', 'lightning_bolt'], // Starter spells
    unlockedCharacters: ['wizard'],
    achievements: [],
  },
  run: {
    inProgress: false,
    seed: 0,
    currentFloor: 0,
    playerHealth: 100,
    playerMaxHealth: 100,
    playerMana: 100,
    playerMaxMana: 100,
    equippedSpells: [],
    inventory: [],
    gold: 0,
    stats: {
      kills: 0,
      damageDealt: 0,
      damageTaken: 0,
      spellsCast: 0,
      roomsCleared: 0,
      timePlayed: 0,
    },
  },
};

/**
 * Save Manager - handles saving and loading game state.
 * 
 * Uses localStorage for browser, can be adapted for other storage.
 */
export class SaveManager {
  private static instance: SaveManager;
  private currentSave: SaveData;
  private autoSaveInterval: number = 60000; // 1 minute
  private autoSaveTimer: number = 0;
  
  private constructor() {
    this.currentSave = this.load() ?? this.createNewSave();
  }
  
  /**
   * Get the singleton instance.
   */
  public static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager();
    }
    return SaveManager.instance;
  }
  
  /**
   * Create a new save file.
   */
  private createNewSave(): SaveData {
    const save = JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA)) as SaveData;
    save.timestamp = Date.now();
    return save;
  }
  
  /**
   * Get current save data.
   */
  public getData(): SaveData {
    return this.currentSave;
  }
  
  /**
   * Update meta progression data.
   */
  public updateMeta(updates: Partial<SaveData['meta']>): void {
    Object.assign(this.currentSave.meta, updates);
    this.save();
  }
  
  /**
   * Update current run data.
   */
  public updateRun(updates: Partial<SaveData['run']>): void {
    Object.assign(this.currentSave.run, updates);
    this.save();
  }
  
  /**
   * Start a new run.
   */
  public startNewRun(seed?: number): void {
    this.currentSave.meta.totalRuns++;
    this.currentSave.run = {
      ...JSON.parse(JSON.stringify(DEFAULT_SAVE_DATA.run)),
      inProgress: true,
      seed: seed ?? Date.now(),
    };
    this.save();
  }
  
  /**
   * End the current run (death or victory).
   */
  public endRun(victory: boolean): void {
    const run = this.currentSave.run;
    const meta = this.currentSave.meta;
    
    // Update meta stats
    if (!victory) {
      meta.totalDeaths++;
    }
    meta.totalKills += run.stats.kills;
    meta.totalFloorsCleared += run.stats.roomsCleared;
    
    if (run.currentFloor > meta.highestFloor) {
      meta.highestFloor = run.currentFloor;
    }
    
    // Clear run data
    run.inProgress = false;
    
    this.save();
  }
  
  /**
   * Unlock a spell.
   */
  public unlockSpell(spellId: string): void {
    if (!this.currentSave.meta.unlockedSpells.includes(spellId)) {
      this.currentSave.meta.unlockedSpells.push(spellId);
      this.save();
    }
  }
  
  /**
   * Check if a spell is unlocked.
   */
  public isSpellUnlocked(spellId: string): boolean {
    return this.currentSave.meta.unlockedSpells.includes(spellId);
  }
  
  /**
   * Unlock an achievement.
   */
  public unlockAchievement(achievementId: string): boolean {
    if (!this.currentSave.meta.achievements.includes(achievementId)) {
      this.currentSave.meta.achievements.push(achievementId);
      this.save();
      return true; // Newly unlocked
    }
    return false; // Already had it
  }
  
  /**
   * Check if there's an in-progress run.
   */
  public hasRunInProgress(): boolean {
    return this.currentSave.run.inProgress;
  }
  
  /**
   * Save to localStorage.
   */
  public save(): void {
    try {
      this.currentSave.timestamp = Date.now();
      const json = JSON.stringify(this.currentSave);
      localStorage.setItem(SAVE_KEY_PREFIX + 'save', json);
    } catch (error) {
      console.error('Failed to save game:', error);
    }
  }
  
  /**
   * Load from localStorage.
   */
  private load(): SaveData | null {
    try {
      const json = localStorage.getItem(SAVE_KEY_PREFIX + 'save');
      if (!json) return null;
      
      const data = JSON.parse(json) as SaveData;
      
      // Handle version migration
      if (data.version < CURRENT_SAVE_VERSION) {
        return this.migrate(data);
      }
      
      return data;
    } catch (error) {
      console.error('Failed to load save:', error);
      return null;
    }
  }
  
  /**
   * Migrate old save data to current version.
   */
  private migrate(oldData: SaveData): SaveData {
    // Add migration logic here as versions change
    // For now, just update version number
    const migrated = {
      ...DEFAULT_SAVE_DATA,
      ...oldData,
      version: CURRENT_SAVE_VERSION,
    };
    return migrated;
  }
  
  /**
   * Delete save data.
   */
  public deleteSave(): void {
    localStorage.removeItem(SAVE_KEY_PREFIX + 'save');
    this.currentSave = this.createNewSave();
  }
  
  /**
   * Export save as JSON string (for backup).
   */
  public exportSave(): string {
    return JSON.stringify(this.currentSave, null, 2);
  }
  
  /**
   * Import save from JSON string.
   */
  public importSave(json: string): boolean {
    try {
      const data = JSON.parse(json) as SaveData;
      if (typeof data.version !== 'number') {
        throw new Error('Invalid save format');
      }
      this.currentSave = data;
      this.save();
      return true;
    } catch (error) {
      console.error('Failed to import save:', error);
      return false;
    }
  }
  
  /**
   * Update auto-save timer. Call each frame.
   */
  public update(delta: number): void {
    if (!this.currentSave.run.inProgress) return;
    
    this.autoSaveTimer += delta;
    if (this.autoSaveTimer >= this.autoSaveInterval) {
      this.autoSaveTimer = 0;
      this.save();
    }
  }
}
