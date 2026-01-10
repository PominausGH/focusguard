import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onComplete: () => void;
  onDelete: () => void;
  isFocusing?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onComplete, onDelete, isFocusing }) => {
  return (
    <View style={[
      styles.container,
      task.completed && styles.completedContainer,
      isFocusing && styles.focusingContainer,
    ]}>
      <TouchableOpacity
        style={[styles.checkbox, task.completed && styles.checkboxCompleted]}
        onPress={onComplete}
      >
        {task.completed && (
          <Ionicons name="checkmark" size={20} color="#fff" />
        )}
      </TouchableOpacity>

      <View style={styles.titleContainer}>
        <Text style={[styles.title, task.completed && styles.titleCompleted]}>
          {task.title}
        </Text>
        {isFocusing && (
          <View style={styles.focusingBadge}>
            <Ionicons name="timer" size={14} color="#2d6a4f" />
            <Text style={styles.focusingText}>Focusing</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
        <Ionicons name="trash-outline" size={20} color="#8b8b8b" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  completedContainer: {
    opacity: 0.7,
    borderColor: '#2d6a4f',
  },
  focusingContainer: {
    borderColor: '#2d6a4f',
    borderWidth: 2,
    backgroundColor: 'rgba(45, 106, 79, 0.05)',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#e94560',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  checkboxCompleted: {
    backgroundColor: '#2d6a4f',
    borderColor: '#2d6a4f',
  },
  titleContainer: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: '#8b8b8b',
  },
  focusingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  focusingText: {
    fontSize: 12,
    color: '#2d6a4f',
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
  },
});
