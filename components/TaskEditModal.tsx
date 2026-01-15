import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task, Subtask, MAX_SUBTASKS_PER_TASK } from '../types';

interface TaskEditModalProps {
  visible: boolean;
  task: Task;
  onClose: () => void;
  onSave: (task: Task) => void;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({
  visible,
  task,
  onClose,
  onSave,
}) => {
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(
    task.estimatedPomodoros?.toString() || ''
  );
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    if (subtasks.length >= MAX_SUBTASKS_PER_TASK) {
      Alert.alert('Limit Reached', `You can only add up to ${MAX_SUBTASKS_PER_TASK} subtasks per task`);
      return;
    }

    const newSubtask: Subtask = {
      id: Date.now().toString(),
      title: newSubtaskTitle.trim(),
      completed: false,
    };

    setSubtasks([...subtasks, newSubtask]);
    setNewSubtaskTitle('');
  };

  const handleDeleteSubtask = (id: string) => {
    setSubtasks(subtasks.filter(st => st.id !== id));
  };

  const handleSave = () => {
    const updatedTask: Task = {
      ...task,
      estimatedPomodoros: estimatedPomodoros ? parseInt(estimatedPomodoros) : undefined,
      subtasks: subtasks.length > 0 ? subtasks : undefined,
    };
    onSave(updatedTask);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Edit Task</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#8b8b8b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.taskTitle}>{task.title}</Text>

            {/* Estimated Pomodoros */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Estimated Pomodoros</Text>
              <View style={styles.pomodoroInput}>
                <Ionicons name="timer-outline" size={20} color="#e94560" />
                <TextInput
                  style={styles.input}
                  value={estimatedPomodoros}
                  onChangeText={setEstimatedPomodoros}
                  keyboardType="number-pad"
                  placeholder="How many 🍅 needed?"
                  placeholderTextColor="#8b8b8b"
                />
              </View>
            </View>

            {/* Subtasks */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                Subtasks ({subtasks.length}/{MAX_SUBTASKS_PER_TASK})
              </Text>

              {subtasks.map(subtask => (
                <View key={subtask.id} style={styles.subtaskItem}>
                  <Text style={styles.subtaskText}>{subtask.title}</Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteSubtask(subtask.id)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#8b8b8b" />
                  </TouchableOpacity>
                </View>
              ))}

              {subtasks.length < MAX_SUBTASKS_PER_TASK && (
                <View style={styles.addSubtaskRow}>
                  <TextInput
                    style={styles.subtaskInput}
                    value={newSubtaskTitle}
                    onChangeText={setNewSubtaskTitle}
                    placeholder="Add a subtask..."
                    placeholderTextColor="#8b8b8b"
                    onSubmitEditing={handleAddSubtask}
                  />
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleAddSubtask}
                  >
                    <Ionicons name="add" size={20} color="#e94560" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
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
    padding: 20,
  },
  modal: {
    backgroundColor: '#16213e',
    borderRadius: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: 20,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b8b8b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  pomodoroInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  subtaskText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
  addSubtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subtaskInput: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e94560',
  },
  saveButton: {
    backgroundColor: '#e94560',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
