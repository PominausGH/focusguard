import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, DEFAULT_SETTINGS } from '../types';
import {
  validateEmail,
  validatePassword,
  validateDisplayName,
  sanitizeInput,
} from '../services/validation';
import { authApi, setToken, getToken, clearToken } from '../services/api';

// Demo mode - set to false to use API backend
const DEMO_MODE = false;

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
    if (DEMO_MODE) {
      loadDemoUser();
    } else {
      loadUser();
    }
  }, []);

  // Demo mode functions (local storage only)
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

  // API mode functions
  const loadUser = async () => {
    try {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await authApi.getMe();
      if (response.data) {
        const userData: User = {
          uid: response.data.id,
          email: response.data.email,
          displayName: response.data.displayName,
          createdAt: new Date(response.data.createdAt),
          settings: response.data.settings || DEFAULT_SETTINGS,
        };
        setUser(userData);
      } else {
        // Token invalid, clear it
        await clearToken();
      }
    } catch (error) {
      console.error('Error loading user:', error);
      await clearToken();
    } finally {
      setLoading(false);
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

    if (DEMO_MODE) {
      // Demo mode - local storage only
      const userData: User = {
        uid: 'demo_' + Date.now(),
        email: sanitizedEmail,
        displayName: sanitizedName,
        createdAt: new Date(),
        settings: DEFAULT_SETTINGS,
      };
      setUser(userData);
      await saveDemoUser(userData);
    } else {
      // API mode
      const response = await authApi.register(sanitizedEmail, password, sanitizedName);

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        await setToken(response.data.token);
        const userData: User = {
          uid: response.data.user.id,
          email: response.data.user.email,
          displayName: response.data.user.displayName,
          createdAt: new Date(response.data.user.createdAt),
          settings: response.data.user.settings || DEFAULT_SETTINGS,
        };
        setUser(userData);
      }
    }
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

    if (DEMO_MODE) {
      // Demo mode - check local storage
      const stored = await AsyncStorage.getItem(DEMO_USER_KEY);
      if (stored) {
        const storedUser = JSON.parse(stored);
        if (storedUser.email.toLowerCase() === email.toLowerCase().trim()) {
          setUser(storedUser);
        } else {
          throw new Error('No account found with this email. Please sign up first.');
        }
      } else {
        throw new Error('No account found. Please sign up first.');
      }
    } else {
      // API mode
      const response = await authApi.login(email.toLowerCase().trim(), password);

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        await setToken(response.data.token);
        const userData: User = {
          uid: response.data.user.id,
          email: response.data.user.email,
          displayName: response.data.user.displayName,
          createdAt: new Date(response.data.user.createdAt),
          settings: response.data.user.settings || DEFAULT_SETTINGS,
        };
        setUser(userData);
      }
    }
  };

  const signOut = async () => {
    setUser(null);
    if (DEMO_MODE) {
      await AsyncStorage.removeItem(DEMO_USER_KEY);
      await AsyncStorage.removeItem('@focusshield_tasks');
    } else {
      await clearToken();
    }
  };

  const updateSettings = async (settings: Partial<User['settings']>) => {
    if (!user) return;

    const updatedUser = {
      ...user,
      settings: { ...user.settings, ...settings },
    };
    setUser(updatedUser);

    if (DEMO_MODE) {
      await saveDemoUser(updatedUser);
    } else {
      // Update settings on API
      const response = await authApi.updateSettings(settings);
      if (response.error) {
        console.error('Failed to sync settings:', response.error);
        // Keep local changes anyway for better UX
      }
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
