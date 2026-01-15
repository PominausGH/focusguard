import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { ambientSounds, AMBIENT_SOUNDS, AmbientSound } from '../services/ambientSounds';

export const AmbientSoundControls: React.FC = () => {
  const [soundStates, setSoundStates] = useState<{ [key: string]: { enabled: boolean; volume: number } }>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const settings = ambientSounds.getSettings();
    const states: { [key: string]: { enabled: boolean; volume: number } } = {};

    AMBIENT_SOUNDS.forEach(sound => {
      states[sound.id] = {
        enabled: settings[sound.id]?.enabled || false,
        volume: settings[sound.id]?.volume || 0.5,
      };
    });

    setSoundStates(states);
  };

  const handleToggleSound = async (soundId: string) => {
    const newEnabled = await ambientSounds.toggleSound(soundId);
    setSoundStates(prev => ({
      ...prev,
      [soundId]: {
        ...prev[soundId],
        enabled: newEnabled,
      },
    }));
  };

  const handleVolumeChange = async (soundId: string, volume: number) => {
    await ambientSounds.setVolume(soundId, volume);
    setSoundStates(prev => ({
      ...prev,
      [soundId]: {
        ...prev[soundId],
        volume,
      },
    }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="musical-notes" size={20} color="#e94560" />
        <Text style={styles.title}>Ambient Sounds</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.soundsList}>
        {AMBIENT_SOUNDS.map(sound => {
          const isEnabled = soundStates[sound.id]?.enabled || false;
          const volume = soundStates[sound.id]?.volume || 0.5;

          return (
            <View key={sound.id} style={styles.soundCard}>
              <TouchableOpacity
                style={[styles.soundButton, isEnabled && styles.soundButtonActive]}
                onPress={() => handleToggleSound(sound.id)}
              >
                <Ionicons
                  name={sound.icon as any}
                  size={24}
                  color={isEnabled ? '#fff' : '#8b8b8b'}
                />
                <Text style={[styles.soundName, isEnabled && styles.soundNameActive]}>
                  {sound.name}
                </Text>
              </TouchableOpacity>

              {isEnabled && (
                <View style={styles.volumeControl}>
                  <Ionicons name="volume-low" size={16} color="#8b8b8b" />
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={1}
                    value={volume}
                    onValueChange={(value) => handleVolumeChange(sound.id, value)}
                    minimumTrackTintColor="#e94560"
                    maximumTrackTintColor="#0f3460"
                    thumbTintColor="#e94560"
                  />
                  <Ionicons name="volume-high" size={16} color="#8b8b8b" />
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  soundsList: {
    flexDirection: 'row',
  },
  soundCard: {
    marginRight: 12,
  },
  soundButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#0f3460',
    minWidth: 100,
    gap: 8,
  },
  soundButtonActive: {
    backgroundColor: 'rgba(233, 69, 96, 0.2)',
    borderColor: '#e94560',
  },
  soundName: {
    fontSize: 12,
    color: '#8b8b8b',
    textAlign: 'center',
  },
  soundNameActive: {
    color: '#fff',
    fontWeight: '600',
  },
  volumeControl: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
    paddingHorizontal: 8,
  },
  slider: {
    flex: 1,
    height: 40,
  },
});
