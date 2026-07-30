import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocus } from '../contexts/FocusContext';

const SHORT_BREAK_SUGGESTIONS = [
  'Stand and stretch 🧘',
  'Hydrate 💧',
  'Look away from screen 👀',
  'Take deep breaths 🌬️',
  'Walk around 🚶',
  'Rest your eyes 😌',
];

const LONG_BREAK_SUGGESTIONS = [
  'Take a walk outside 🚶‍♂️',
  'Have a healthy snack 🍎',
  'Meditate for 5 minutes 🧘‍♀️',
  'Step outside for fresh air 🌳',
  'Do some light exercise 💪',
  'Clear your mind 🧠',
];

export const BreakOverlay: React.FC = () => {
  const { session, timeRemaining, skipBreak } = useFocus();

  const suggestion = useMemo(() => {
    if (!session) return '';
    const suggestions = session.state === 'longBreak' ? LONG_BREAK_SUGGESTIONS : SHORT_BREAK_SUGGESTIONS;
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  }, [session?.id, session?.state]);

  if (!session || session.state === 'working') {
    return null;
  }

  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);

  const breakType = session.state === 'longBreak' ? 'Long Break' : 'Short Break';

  return (
    <View style={styles.overlay}>
      <View style={styles.content}>
        <Ionicons name="cafe-outline" size={64} color="#e94560" />

        <Text style={styles.breakType}>{breakType}</Text>

        <Text style={styles.timer}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </Text>

        <View style={styles.suggestionBox}>
          <Text style={styles.suggestion}>{suggestion}</Text>
        </View>

        <Text style={styles.hint}>Take a moment to recharge</Text>

        <TouchableOpacity style={styles.skipButton} onPress={skipBreak}>
          <Text style={styles.skipButtonText}>Skip Break</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  content: {
    alignItems: 'center',
    padding: 32,
  },
  breakType: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 24,
  },
  timer: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#e94560',
    marginTop: 16,
    fontFamily: 'monospace',
  },
  suggestionBox: {
    backgroundColor: 'rgba(233, 69, 96, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginTop: 32,
    borderWidth: 1,
    borderColor: '#e94560',
  },
  suggestion: {
    fontSize: 20,
    color: '#e94560',
    textAlign: 'center',
  },
  hint: {
    fontSize: 14,
    color: '#8b8b8b',
    marginTop: 24,
  },
  skipButton: {
    marginTop: 48,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8b8b8b',
  },
  skipButtonText: {
    color: '#8b8b8b',
    fontSize: 16,
    fontWeight: '600',
  },
});
