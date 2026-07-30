import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { ThemeColors, DARK_THEME, LIGHT_THEME } from '../types';

interface ThemeContextType {
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const auth = useAuth();

  // Use dark theme by default, or user's preference if logged in
  const themeMode = auth?.user?.settings?.theme || 'dark';
  const isDark = themeMode === 'dark';

  const baseTheme = isDark ? DARK_THEME : LIGHT_THEME;
  const customColors = auth?.user?.settings?.customColors || {};
  const colors: ThemeColors = { ...baseTheme, ...customColors };

  return (
    <ThemeContext.Provider value={{ colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
