import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useThemedStyles } from '../hooks/useThemedStyles';

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
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
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
          placeholderTextColor={disabled ? colors.primary : colors.textSecondary}
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
            color={disabled || !title.trim() ? colors.textSecondary : '#fff'}
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

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    paddingRight: 60,
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputDisabled: {
    borderColor: colors.primary,
    opacity: 0.8,
  },
  addButton: {
    position: 'absolute',
    right: 8,
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  remainingText: {
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
});
