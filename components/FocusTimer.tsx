import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocus } from '../contexts/FocusContext';
import { useTasks } from '../contexts/TaskContext';
import { FOCUS_PRESETS, FocusPresetType } from '../types';
import { Svg, Circle } from 'react-native-svg';

interface FocusTimerProps {
  visible: boolean;
  onClose: () => void;
}

export const FocusTimer: React.FC<FocusTimerProps> = ({ visible, onClose }) => {
  const { session, timeRemaining, endSession } = useFocus();
  const { tasks } = useTasks();

  if (!session) return null;

  const linkedTask = session.linkedTaskId
    ? tasks.find(t => t.id === session.linkedTaskId)
    : undefined;

  const preset = FOCUS_PRESETS[session.mode];
  const totalDuration = session.duration;
  const progress = 1 - (timeRemaining / totalDuration);

  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);

  const handleEndSession = () => {
    if (typeof window !== 'undefined' && window.confirm) {
      const confirmed = window.confirm('End this focus session?');
      if (confirmed) {
        endSession();
        onClose();
      }
    } else {
      // For mobile, just end
      endSession();
      onClose();
    }
  };

  const stateLabel = session.state === 'working' ? 'Focus Time' :
                     session.state === 'shortBreak' ? 'Short Break' : 'Long Break';

  const sessionProgress = `Session ${session.currentSessionInCycle}/${preset.longBreakAfter}`;

  // Circle progress parameters
  const size = 240;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress * circumference);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="chevron-down" size={24} color="#8b8b8b" />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={styles.presetName}>{preset.name}</Text>
            <Text style={styles.sessionProgress}>{sessionProgress}</Text>
          </View>

          {linkedTask && (
            <View style={styles.taskBadge}>
              <Ionicons name="checkbox-outline" size={16} color="#e94560" />
              <Text style={styles.taskTitle}>{linkedTask.title}</Text>
            </View>
          )}

          <View style={styles.timerContainer}>
            <Svg width={size} height={size} style={styles.progressRing}>
              {/* Background circle */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#1a1a2e"
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Progress circle */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#e94560"
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            </Svg>

            <View style={styles.timerContent}>
              <Text style={styles.timerText}>
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </Text>
              <Text style={styles.stateLabel}>{stateLabel}</Text>
              <Text style={styles.pomodoroCount}>
                {session.pomodorosCompleted} pomodoro{session.pomodorosCompleted !== 1 ? 's' : ''} completed
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.endButton} onPress={handleEndSession}>
            <Ionicons name="stop-circle-outline" size={24} color="#e94560" />
            <Text style={styles.endButtonText}>End Session</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#16213e',
    borderRadius: 24,
    padding: 32,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
  headerInfo: {
    alignItems: 'center',
    marginBottom: 8,
  },
  presetName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  sessionProgress: {
    fontSize: 14,
    color: '#8b8b8b',
    fontWeight: '600',
  },
  taskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(233, 69, 96, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginBottom: 24,
  },
  taskTitle: {
    color: '#e94560',
    fontSize: 14,
    fontWeight: '600',
  },
  timerContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  progressRing: {
    transform: [{ rotate: '-90deg' }],
  },
  timerContent: {
    position: 'absolute',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'monospace',
  },
  stateLabel: {
    fontSize: 16,
    color: '#e94560',
    marginTop: 8,
    fontWeight: '600',
  },
  pomodoroCount: {
    fontSize: 12,
    color: '#8b8b8b',
    marginTop: 4,
  },
  endButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e94560',
    marginTop: 8,
  },
  endButtonText: {
    color: '#e94560',
    fontSize: 16,
    fontWeight: '600',
  },
});
