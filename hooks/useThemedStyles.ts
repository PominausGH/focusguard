import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeColors } from '../types';

export function useThemedStyles<T>(
  styleFactory: (colors: ThemeColors) => T
): T {
  const { colors } = useTheme();
  return useMemo(() => styleFactory(colors), [colors]);
}
