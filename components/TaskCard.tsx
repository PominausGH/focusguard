import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task, PRIORITY_COLORS } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useThemedStyles } from '../hooks/useThemedStyles';

interface TaskCardProps {
  task: Task;
  priorityIndex: number; // 0, 1, or 2 for Red, Yellow, Green
  onComplete: () => void;
  onDelete: () => void;
  onEdit?: () => void;
  onUpdate?: (task: Task) => void;
  isFocusing?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  priorityIndex,
  onComplete,
  onDelete,
  onEdit,
  onUpdate,
  isFocusing
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const priorityColor = PRIORITY_COLORS[priorityIndex] || PRIORITY_COLORS[2];

  const handleToggleSubtask = (subtaskId: string) => {
    if (!onUpdate || !task.subtasks) return;

    const updatedSubtasks = task.subtasks.map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    onUpdate({ ...task, subtasks: updatedSubtasks });
  };

  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  return (
    <View style={[
      styles.container,
      task.completed && styles.completedContainer,
      isFocusing && styles.focusingContainer,
    ]}>
      {/* Priority Color Indicator */}
      <View style={[styles.priorityIndicator, { backgroundColor: priorityColor }]} />

      <TouchableOpacity
        style={[styles.checkbox, task.completed && styles.checkboxCompleted]}
        onPress={onComplete}
      >
        {task.completed && (
          <Ionicons name="checkmark" size={20} color="#fff" />
        )}
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, task.completed && styles.titleCompleted]}>
            {task.title}
          </Text>

          <View style={styles.metaRow}>
            {task.estimatedPomodoros && task.estimatedPomodoros > 0 && (
              <View style={styles.pomodorosBadge}>
                <Ionicons name="timer-outline" size={14} color="#e94560" />
                <Text style={styles.pomodorosText}>{task.estimatedPomodoros} 🍅</Text>
              </View>
            )}

            {isFocusing && (
              <View style={styles.focusingBadge}>
                <Ionicons name="timer" size={14} color="#2d6a4f" />
                <Text style={styles.focusingText}>Focusing</Text>
              </View>
            )}

            {totalSubtasks > 0 && (
              <TouchableOpacity
                style={styles.subtasksBadge}
                onPress={() => setShowSubtasks(!showSubtasks)}
              >
                <Ionicons
                  name={showSubtasks ? "chevron-up" : "chevron-down"}
                  size={14}
                  color="#8b8b8b"
                />
                <Text style={styles.subtasksText}>
                  {completedSubtasks}/{totalSubtasks} subtasks
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Subtasks List */}
        {showSubtasks && totalSubtasks > 0 && (
          <View style={styles.subtasksList}>
            {task.subtasks?.map(subtask => (
              <TouchableOpacity
                key={subtask.id}
                style={styles.subtaskItem}
                onPress={() => handleToggleSubtask(subtask.id)}
              >
                <View style={[
                  styles.subtaskCheckbox,
                  subtask.completed && styles.subtaskCheckboxCompleted
                ]}>
                  {subtask.completed && (
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  )}
                </View>
                <Text style={[
                  styles.subtaskTitle,
                  subtask.completed && styles.subtaskTitleCompleted
                ]}>
                  {subtask.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.actions}>
        {onEdit && (
          <TouchableOpacity style={styles.editButton} onPress={onEdit}>
            <Ionicons name="create-outline" size={20} color="#8b8b8b" />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
          <Ionicons name="trash-outline" size={20} color="#8b8b8b" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  completedContainer: {
    opacity: 0.7,
    borderColor: colors.success,
  },
  focusingContainer: {
    borderColor: colors.success,
    borderWidth: 2,
    backgroundColor: 'rgba(45, 106, 79, 0.05)',
  },
  priorityIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginLeft: 8,
    marginTop: 2,
  },
  checkboxCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  content: {
    flex: 1,
  },
  titleContainer: {
    flex: 1,
    gap: 8,
  },
  title: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  pomodorosBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(233, 69, 96, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pomodorosText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  focusingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(45, 106, 79, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  focusingText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
  },
  subtasksBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 139, 139, 0.1)',
  },
  subtasksText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  subtasksList: {
    marginTop: 12,
    gap: 8,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subtaskCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtaskCheckboxCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  subtaskTitle: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  subtaskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: 4,
  },
  editButton: {
    padding: 8,
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
    marginTop: 2,
  },
});
