import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOUND_SETTINGS_KEY = '@focusshield_sound_settings';

export interface AmbientSound {
  id: string;
  name: string;
  icon: string;
  url: string;
}

export interface SoundSettings {
  [soundId: string]: {
    enabled: boolean;
    volume: number; // 0-1
  };
}

export const AMBIENT_SOUNDS: AmbientSound[] = [
  {
    id: 'rain',
    name: 'Rain',
    icon: 'rainy',
    url: 'https://assets.mixkit.co/active_storage/sfx/2393/2393-preview.mp3', // Rain sound
  },
  {
    id: 'waves',
    name: 'Ocean Waves',
    icon: 'water',
    url: 'https://assets.mixkit.co/active_storage/sfx/2390/2390-preview.mp3', // Ocean waves
  },
  {
    id: 'forest',
    name: 'Forest',
    icon: 'leaf',
    url: 'https://assets.mixkit.co/active_storage/sfx/1228/1228-preview.mp3', // Forest ambience
  },
  {
    id: 'cafe',
    name: 'Coffee Shop',
    icon: 'cafe',
    url: 'https://assets.mixkit.co/active_storage/sfx/1228/1228-preview.mp3', // Cafe ambience
  },
  {
    id: 'whitenoise',
    name: 'White Noise',
    icon: 'radio',
    url: 'https://assets.mixkit.co/active_storage/sfx/2393/2393-preview.mp3', // White noise
  },
];

class AmbientSoundService {
  private sounds: Map<string, Audio.Sound> = new Map();
  private settings: SoundSettings = {};
  private loaded: boolean = false;

  async loadSettings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(SOUND_SETTINGS_KEY);
      if (stored) {
        this.settings = JSON.parse(stored);
      } else {
        // Default settings: all sounds off
        this.settings = {};
        AMBIENT_SOUNDS.forEach((sound) => {
          this.settings[sound.id] = { enabled: false, volume: 0.5 };
        });
      }
      this.loaded = true;
    } catch (error) {
      console.error('Failed to load sound settings:', error);
      this.loaded = true;
    }
  }

  async saveSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem(SOUND_SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save sound settings:', error);
    }
  }

  private async ensureLoaded(): Promise<void> {
    if (!this.loaded) {
      await this.loadSettings();
    }
  }

  async loadSound(soundId: string): Promise<void> {
    if (this.sounds.has(soundId)) return;

    const ambientSound = AMBIENT_SOUNDS.find((s) => s.id === soundId);
    if (!ambientSound) return;

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: ambientSound.url },
        { isLooping: true, volume: this.settings[soundId]?.volume || 0.5 }
      );
      this.sounds.set(soundId, sound);
    } catch (error) {
      console.error(`Failed to load sound ${soundId}:`, error);
    }
  }

  async playSound(soundId: string): Promise<void> {
    await this.ensureLoaded();

    if (!this.sounds.has(soundId)) {
      await this.loadSound(soundId);
    }

    const sound = this.sounds.get(soundId);
    if (sound) {
      try {
        await sound.playAsync();
      } catch (error) {
        console.error(`Failed to play sound ${soundId}:`, error);
      }
    }
  }

  async stopSound(soundId: string): Promise<void> {
    const sound = this.sounds.get(soundId);
    if (sound) {
      try {
        await sound.stopAsync();
      } catch (error) {
        console.error(`Failed to stop sound ${soundId}:`, error);
      }
    }
  }

  async setVolume(soundId: string, volume: number): Promise<void> {
    await this.ensureLoaded();

    const sound = this.sounds.get(soundId);
    if (sound) {
      try {
        await sound.setVolumeAsync(volume);
      } catch (error) {
        console.error(`Failed to set volume for ${soundId}:`, error);
      }
    }

    if (!this.settings[soundId]) {
      this.settings[soundId] = { enabled: false, volume };
    } else {
      this.settings[soundId].volume = volume;
    }
    await this.saveSettings();
  }

  async toggleSound(soundId: string): Promise<boolean> {
    await this.ensureLoaded();

    const wasEnabled = this.settings[soundId]?.enabled || false;
    const newEnabled = !wasEnabled;

    if (!this.settings[soundId]) {
      this.settings[soundId] = { enabled: newEnabled, volume: 0.5 };
    } else {
      this.settings[soundId].enabled = newEnabled;
    }

    if (newEnabled) {
      await this.playSound(soundId);
    } else {
      await this.stopSound(soundId);
    }

    await this.saveSettings();
    return newEnabled;
  }

  async stopAll(): Promise<void> {
    for (const [soundId, sound] of this.sounds) {
      try {
        await sound.stopAsync();
      } catch (error) {
        console.error(`Failed to stop sound ${soundId}:`, error);
      }
    }
  }

  async unloadAll(): Promise<void> {
    for (const [soundId, sound] of this.sounds) {
      try {
        await sound.unloadAsync();
      } catch (error) {
        console.error(`Failed to unload sound ${soundId}:`, error);
      }
    }
    this.sounds.clear();
  }

  getSettings(): SoundSettings {
    return { ...this.settings };
  }

  isSoundEnabled(soundId: string): boolean {
    return this.settings[soundId]?.enabled || false;
  }

  getSoundVolume(soundId: string): number {
    return this.settings[soundId]?.volume || 0.5;
  }
}

export const ambientSounds = new AmbientSoundService();
