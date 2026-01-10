import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TaskInputProps {
  onSubmit: (title: string) => void;
  disabled: boolean;
  tasksRemaining: number;
}

export const TaskInput: React.FC<TaskInputProps> = ({
  onSubmit,
  disabled,
  tasksRemaining,
}) => {
  const [title, setTitle] = useState('');

  const handleSubmit = () => {
    if (title.trim() && !disabled) {
      onSubmit(title.trim());
      setTitle('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, disabled && styles.inputDisabled]}
          placeholder={
            disabled
              ? "You've reached today's limit!"
              : "What's your focus?"
          }
          placeholderTextColor={disabled ? '#e94560' : '#8b8b8b'}
          value={title}
          onChangeText={setTitle}
          onSubmitEditing={handleSubmit}
          editable={!disabled}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[styles.addButton, disabled && styles.addButtonDisabled]}
          onPress={handleSubmit}
          disabled={disabled || !title.trim()}
        >
          <Ionicons
            name="add"
            size={24}
            color={disabled || !title.trim() ? '#8b8b8b' : '#fff'}
          />
        </TouchableOpacity>
      </View>
      <Text style={styles.remainingText}>
        {disabled
          ? 'Complete your tasks or wait until tomorrow'
          : `${tasksRemaining} task${tasksRemaining !== 1 ? 's' : ''} remaining today`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    paddingRight: 60,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  inputDisabled: {
    borderColor: '#e94560',
    opacity: 0.8,
  },
  addButton: {
    position: 'absolute',
    right: 8,
    backgroundColor: '#e94560',
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  remainingText: {
    marginTop: 8,
    color: '#8b8b8b',
    fontSize: 12,
    textAlign: 'center',
  },
});
