import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MAX_DAILY_TASKS } from '../types';

interface DailyProgressProps {
  completed: number;
  total: number;
}

export const DailyProgress: React.FC<DailyProgressProps> = ({ completed, total }) => {
  const progress = total > 0 ? (completed / total) * 100 : 0;
  const tasksLeft = MAX_DAILY_TASKS - total;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Today's Progress</Text>
        <Text style={styles.count}>
          {completed}/{total} completed
        </Text>
      </View>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress}%` },
            progress === 100 && styles.progressComplete,
          ]}
        />
      </View>
      {tasksLeft > 0 && (
        <Text style={styles.remaining}>
          {tasksLeft} task slot{tasksLeft !== 1 ? 's' : ''} available
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#8b8b8b',
    fontWeight: '600',
  },
  count: {
    fontSize: 14,
    color: '#e94560',
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#1a1a2e',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#e94560',
    borderRadius: 4,
  },
  progressComplete: {
    backgroundColor: '#2d6a4f',
  },
  remaining: {
    marginTop: 6,
    fontSize: 12,
    color: '#8b8b8b',
    textAlign: 'center',
  },
});
