import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTasks } from '../../contexts/TaskContext';
import { useAuth } from '../../contexts/AuthContext';
import { useFocus } from '../../contexts/FocusContext';
import { TaskCard } from '../../components/TaskCard';
import { TaskInput } from '../../components/TaskInput';
import { DailyProgress } from '../../components/DailyProgress';
import { FocusTimer } from '../../components/FocusTimer';
import { MAX_DAILY_TASKS, FocusPresetType, FOCUS_PRESETS } from '../../types';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

export default function TasksScreen() {
  const { tasks, loading, canAddTask, completedCount, addTask, completeTask, uncompleteTask, deleteTask } = useTasks();
  const { user } = useAuth();
  const { startSession, session, isActive, skipBreak, endSession } = useFocus();
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>();

  const handleAddTask = async (title: string) => {
    try {
      await addTask(title);
    } catch (error) {
      Alert.alert('Error', 'Failed to add task');
    }
  };

  const handleCompleteTask = async (taskId: string, isCompleted: boolean) => {
    try {
      if (isCompleted) {
        await uncompleteTask(taskId);
      } else {
        await completeTask(taskId);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    // On web, use native confirm. On mobile, use Alert.alert
    if (typeof window !== 'undefined' && window.confirm) {
      const confirmed = window.confirm('Are you sure you want to delete this task?');
      if (confirmed) {
        try {
          await deleteTask(taskId);
        } catch (error) {
          alert('Failed to delete task');
        }
      }
    } else {
      Alert.alert(
        'Delete Task',
        'Are you sure you want to delete this task?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteTask(taskId);
              } catch (error) {
                Alert.alert('Error', 'Failed to delete task');
              }
            },
          },
        ]
      );
    }
  };

  const handleStartFocus = (preset: FocusPresetType) => {
    startSession(preset, selectedTaskId);
    setShowPresetModal(false);
    setShowTimerModal(true);
    setSelectedTaskId(undefined); // Reset selection
  };

  const handleFocusButtonPress = () => {
    if (isActive) {
      setShowTimerModal(true);
    } else {
      setShowPresetModal(true);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSpace: () => {
      // Toggle timer modal if session is active
      if (isActive) {
        setShowTimerModal(prev => !prev);
      }
    },
    onReset: () => {
      if (isActive && typeof window !== 'undefined' && window.confirm) {
        const confirmed = window.confirm('End this focus session?');
        if (confirmed) {
          session?.state === 'working' ? skipBreak() : endSession();
        }
      }
    },
    onSkip: () => {
      if (session?.state !== 'working') {
        skipBreak();
      }
    },
    onPreset1: () => {
      if (!isActive) handleStartFocus('classic');
    },
    onPreset2: () => {
      if (!isActive) handleStartFocus('deepwork');
    },
    onPreset3: () => {
      if (!isActive) handleStartFocus('sprint');
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {getGreeting()}, {user?.displayName?.split(' ')[0] || 'there'}!
          </Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        <DailyProgress completed={completedCount} total={tasks.length} />

        <TaskInput
          onSubmit={handleAddTask}
          disabled={!canAddTask}
          tasksRemaining={MAX_DAILY_TASKS - tasks.length}
        />

        {loading ? (
          <ActivityIndicator size="large" color="#e94560" style={styles.loader} />
        ) : tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyTitle}>No tasks yet</Text>
            <Text style={styles.emptyText}>
              What's the ONE thing you need to accomplish today?
            </Text>
          </View>
        ) : (
          <View style={styles.taskList}>
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={() => handleCompleteTask(task.id, task.completed)}
                onDelete={() => handleDeleteTask(task.id)}
                isFocusing={session?.linkedTaskId === task.id && session?.state === 'working'}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button for Focus Timer */}
      <TouchableOpacity
        style={[styles.fabButton, isActive && styles.fabButtonActive]}
        onPress={handleFocusButtonPress}
      >
        <Ionicons name="timer-outline" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Preset Selection Modal */}
      <Modal
        visible={showPresetModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPresetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.presetModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Start Focus Session</Text>
              <TouchableOpacity onPress={() => setShowPresetModal(false)}>
                <Ionicons name="close" size={24} color="#8b8b8b" />
              </TouchableOpacity>
            </View>

            {/* Task Selection */}
            {tasks.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Focus on task (optional)</Text>
                <View style={styles.taskSelector}>
                  <TouchableOpacity
                    style={[styles.taskOption, !selectedTaskId && styles.taskOptionSelected]}
                    onPress={() => setSelectedTaskId(undefined)}
                  >
                    <Ionicons
                      name={!selectedTaskId ? "radio-button-on" : "radio-button-off"}
                      size={20}
                      color={!selectedTaskId ? "#e94560" : "#8b8b8b"}
                    />
                    <Text style={styles.taskOptionText}>No specific task</Text>
                  </TouchableOpacity>
                  {tasks.filter(t => !t.completed).map((task) => (
                    <TouchableOpacity
                      key={task.id}
                      style={[styles.taskOption, selectedTaskId === task.id && styles.taskOptionSelected]}
                      onPress={() => setSelectedTaskId(task.id)}
                    >
                      <Ionicons
                        name={selectedTaskId === task.id ? "radio-button-on" : "radio-button-off"}
                        size={20}
                        color={selectedTaskId === task.id ? "#e94560" : "#8b8b8b"}
                      />
                      <Text style={styles.taskOptionText} numberOfLines={1}>{task.title}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.sectionLabel}>Choose focus mode</Text>
              </>
            )}

            {(Object.keys(FOCUS_PRESETS) as FocusPresetType[]).map((preset) => {
              const config = FOCUS_PRESETS[preset];
              return (
                <TouchableOpacity
                  key={preset}
                  style={styles.presetOption}
                  onPress={() => handleStartFocus(preset)}
                >
                  <View>
                    <Text style={styles.presetName}>{config.name}</Text>
                    <Text style={styles.presetDetails}>
                      {config.workDuration / 60000} min work · {config.shortBreakDuration / 60000} min break
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#e94560" />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* Timer Modal */}
      <FocusTimer
        visible={showTimerModal}
        onClose={() => setShowTimerModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16213e',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: '#8b8b8b',
  },
  loader: {
    marginTop: 40,
  },
  taskList: {
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
    padding: 20,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#8b8b8b',
    textAlign: 'center',
  },
  fabButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e94560',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabButtonActive: {
    backgroundColor: '#2d6a4f',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetModal: {
    backgroundColor: '#16213e',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  presetOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  presetName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  presetDetails: {
    fontSize: 14,
    color: '#8b8b8b',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8b8b8b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 8,
  },
  taskSelector: {
    marginBottom: 16,
  },
  taskOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#0f3460',
    gap: 12,
  },
  taskOptionSelected: {
    borderColor: '#e94560',
    backgroundColor: 'rgba(233, 69, 96, 0.1)',
  },
  taskOptionText: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
  },
});
