import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, DEFAULT_SETTINGS } from '../types';
import {
  validateEmail,
  validatePassword,
  validateDisplayName,
  sanitizeInput,
} from '../services/validation';

// Demo mode - set to true to bypass Firebase
const DEMO_MODE = true;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateSettings: (settings: Partial<User['settings']>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER_KEY = '@focusshield_demo_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDemoUser();
  }, []);

  const loadDemoUser = async () => {
    try {
      const stored = await AsyncStorage.getItem(DEMO_USER_KEY);
      if (stored) {
        const userData = JSON.parse(stored);
        setUser(userData);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveDemoUser = async (userData: User) => {
    try {
      await AsyncStorage.setItem(DEMO_USER_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      throw new Error(emailValidation.error);
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.error);
    }

    // Validate display name
    const nameValidation = validateDisplayName(displayName);
    if (!nameValidation.isValid) {
      throw new Error(nameValidation.error);
    }

    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email.toLowerCase().trim());
    const sanitizedName = sanitizeInput(displayName.trim());

    const userData: User = {
      uid: 'demo_' + Date.now(),
      email: sanitizedEmail,
      displayName: sanitizedName,
      createdAt: new Date(),
      settings: DEFAULT_SETTINGS,
    };
    setUser(userData);
    await saveDemoUser(userData);
  };

  const signIn = async (email: string, password: string) => {
    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      throw new Error(emailValidation.error);
    }

    // Basic password check (not empty)
    if (!password || password.trim() === '') {
      throw new Error('Password is required');
    }

    // In demo mode, just create/restore user
    const stored = await AsyncStorage.getItem(DEMO_USER_KEY);
    if (stored) {
      const storedUser = JSON.parse(stored);
      // Check if email matches (case insensitive)
      if (storedUser.email.toLowerCase() === email.toLowerCase().trim()) {
        setUser(storedUser);
      } else {
        throw new Error('No account found with this email. Please sign up first.');
      }
    } else {
      throw new Error('No account found. Please sign up first.');
    }
  };

  const signOut = async () => {
    setUser(null);
    await AsyncStorage.removeItem(DEMO_USER_KEY);
    await AsyncStorage.removeItem('@focusshield_tasks');
  };

  const updateSettings = (settings: Partial<User['settings']>) => {
    if (user) {
      const updatedUser = {
        ...user,
        settings: { ...user.settings, ...settings },
      };
      setUser(updatedUser);
      saveDemoUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, updateSettings }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
