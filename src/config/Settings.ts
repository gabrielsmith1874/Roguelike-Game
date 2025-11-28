/**
 * @file Settings.ts
 * @description User-configurable settings with persistence.
 */

import { DEFAULT_MASTER_VOLUME, DEFAULT_MUSIC_VOLUME, DEFAULT_SFX_VOLUME } from './Constants';

/**
 * User settings interface.
 * Add new settings here as the game expands.
 */
export interface IGameSettings {
  // Audio
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  
  // Display
  screenShake: boolean;
  showDamageNumbers: boolean;
  showMinimap: boolean;
  
  // Controls
  // TODO: Add control remapping settings
  
  // Accessibility
  // TODO: Add accessibility options
}

const SETTINGS_STORAGE_KEY = 'arcane_depths_settings';

/**
 * Default settings values.
 */
const DEFAULT_SETTINGS: IGameSettings = {
  masterVolume: DEFAULT_MASTER_VOLUME,
  musicVolume: DEFAULT_MUSIC_VOLUME,
  sfxVolume: DEFAULT_SFX_VOLUME,
  screenShake: true,
  showDamageNumbers: true,
  showMinimap: true,
};

/**
 * Settings manager for user preferences.
 * Handles loading/saving to localStorage.
 */
export class Settings {
  private static instance: Settings;
  private settings: IGameSettings;
  
  private constructor() {
    this.settings = this.load();
  }
  
  public static getInstance(): Settings {
    if (!Settings.instance) {
      Settings.instance = new Settings();
    }
    return Settings.instance;
  }
  
  /**
   * Get a setting value.
   */
  public get<K extends keyof IGameSettings>(key: K): IGameSettings[K] {
    return this.settings[key];
  }
  
  /**
   * Set a setting value and persist.
   */
  public set<K extends keyof IGameSettings>(key: K, value: IGameSettings[K]): void {
    this.settings[key] = value;
    this.save();
  }
  
  /**
   * Get all settings.
   */
  public getAll(): Readonly<IGameSettings> {
    return { ...this.settings };
  }
  
  /**
   * Reset all settings to defaults.
   */
  public reset(): void {
    this.settings = { ...DEFAULT_SETTINGS };
    this.save();
  }
  
  /**
   * Load settings from localStorage.
   */
  private load(): IGameSettings {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to handle new settings
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    return { ...DEFAULT_SETTINGS };
  }
  
  /**
   * Save settings to localStorage.
   */
  private save(): void {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }
}
