/**
 * @file AudioManager.ts
 * @description Audio system for music and sound effects.
 */

import Phaser from 'phaser';
import { Settings } from '@config/Settings';

/**
 * Audio Manager - handles all game audio.
 * 
 * Features:
 * - Music playback with crossfade
 * - Sound effect pooling
 * - Volume control tied to settings
 * - Spatial audio support
 */
export class AudioManager {
  private static instance: AudioManager;
  
  private scene: Phaser.Scene | null = null;
  private currentMusic: Phaser.Sound.BaseSound | null = null;
  private musicKey: string = '';
  
  // Sound effect pools for frequently played sounds
  private sfxPools: Map<string, Phaser.Sound.BaseSound[]> = new Map();
  private poolSize: number = 5;
  
  private constructor() {}
  
  /**
   * Get the singleton instance.
   */
  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }
  
  /**
   * Initialize with a scene reference.
   * Call this when game scene starts.
   */
  public initialize(scene: Phaser.Scene): void {
    this.scene = scene;
  }
  
  /**
   * Play background music.
   */
  public playMusic(key: string, fadeIn: boolean = true): void {
    if (!this.scene || this.musicKey === key) return;
    
    // Stop current music
    if (this.currentMusic) {
      if (fadeIn) {
        this.fadeOutMusic(500);
      } else {
        this.currentMusic.stop();
      }
    }
    
    // Start new music
    const settings = Settings.getInstance();
    const volume = settings.get('masterVolume') * settings.get('musicVolume');
    
    this.currentMusic = this.scene.sound.add(key, {
      loop: true,
      volume: fadeIn ? 0 : volume,
    });
    
    this.currentMusic.play();
    this.musicKey = key;
    
    if (fadeIn) {
      this.scene.tweens.add({
        targets: this.currentMusic,
        volume: volume,
        duration: 500,
      });
    }
  }
  
  /**
   * Stop current music.
   */
  public stopMusic(fadeOut: boolean = true): void {
    if (!this.currentMusic) return;
    
    if (fadeOut) {
      this.fadeOutMusic(500);
    } else {
      this.currentMusic.stop();
      this.currentMusic = null;
      this.musicKey = '';
    }
  }
  
  /**
   * Fade out current music.
   */
  private fadeOutMusic(duration: number): void {
    if (!this.scene || !this.currentMusic) return;
    
    const music = this.currentMusic;
    this.scene.tweens.add({
      targets: music,
      volume: 0,
      duration,
      onComplete: () => {
        music.stop();
      },
    });
    
    this.currentMusic = null;
    this.musicKey = '';
  }
  
  /**
   * Play a sound effect.
   */
  public playSFX(key: string, volume: number = 1.0): void {
    if (!this.scene) return;
    
    const settings = Settings.getInstance();
    const finalVolume = settings.get('masterVolume') * settings.get('sfxVolume') * volume;
    
    // Try to use pooled sound
    const pooled = this.getFromPool(key);
    if (pooled) {
      (pooled as Phaser.Sound.WebAudioSound).setVolume(finalVolume);
      pooled.play();
      return;
    }
    
    // Create new sound
    this.scene.sound.play(key, { volume: finalVolume });
  }
  
  /**
   * Play a spatial sound effect.
   */
  public playSFXAt(
    key: string, 
    x: number, 
    y: number, 
    listenerX: number, 
    listenerY: number,
    maxDistance: number = 500
  ): void {
    const distance = Phaser.Math.Distance.Between(x, y, listenerX, listenerY);
    if (distance > maxDistance) return;
    
    const volume = 1 - (distance / maxDistance);
    const pan = Phaser.Math.Clamp((x - listenerX) / maxDistance, -1, 1);
    
    this.playSFXWithPan(key, volume, pan);
  }
  
  /**
   * Play a sound effect with panning.
   */
  private playSFXWithPan(key: string, volume: number, _pan: number): void {
    if (!this.scene) return;
    
    const settings = Settings.getInstance();
    const finalVolume = settings.get('masterVolume') * settings.get('sfxVolume') * volume;
    
    // Note: Phaser's panning support varies by sound type
    // This is a simplified implementation
    this.scene.sound.play(key, { volume: finalVolume });
  }
  
  /**
   * Pre-pool sounds for frequently used effects.
   */
  public poolSound(key: string, size: number = this.poolSize): void {
    if (!this.scene || this.sfxPools.has(key)) return;
    
    const pool: Phaser.Sound.BaseSound[] = [];
    for (let i = 0; i < size; i++) {
      pool.push(this.scene.sound.add(key));
    }
    this.sfxPools.set(key, pool);
  }
  
  /**
   * Get an available sound from pool.
   */
  private getFromPool(key: string): Phaser.Sound.BaseSound | null {
    const pool = this.sfxPools.get(key);
    if (!pool) return null;
    
    // Find a sound that isn't playing
    for (const sound of pool) {
      if (!sound.isPlaying) {
        return sound;
      }
    }
    
    return null;
  }
  
  /**
   * Update music volume (call when settings change).
   */
  public updateMusicVolume(): void {
    if (!this.currentMusic) return;
    
    const settings = Settings.getInstance();
    const volume = settings.get('masterVolume') * settings.get('musicVolume');
    (this.currentMusic as Phaser.Sound.WebAudioSound).setVolume(volume);
  }
  
  /**
   * Pause all audio.
   */
  public pauseAll(): void {
    this.scene?.sound.pauseAll();
  }
  
  /**
   * Resume all audio.
   */
  public resumeAll(): void {
    this.scene?.sound.resumeAll();
  }
  
  /**
   * Clean up.
   */
  public destroy(): void {
    this.sfxPools.clear();
    this.currentMusic = null;
    this.scene = null;
  }
}
