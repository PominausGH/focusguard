export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  createdAt: Date;
  settings: UserSettings;
}

export interface MusicLink {
  id: string;
  name: string;
  url: string;
  type: 'spotify' | 'youtube' | 'other';
}

export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  primary: string;
  background: string;
  cardBackground: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  danger: string;
}

export interface UserSettings {
  defaultSalary: number;
  notifications: boolean;
  musicLinks?: MusicLink[];
  theme?: ThemeMode;
  customColors?: Partial<ThemeColors>;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
  date: string; // YYYY-MM-DD for daily grouping
  tags?: string[];
  focusTime?: number; // total minutes spent focusing on this task
  estimatedPomodoros?: number; // estimated pomodoros needed
  subtasks?: Subtask[]; // max 3 subtasks
}

export interface MeetingSession {
  id: string;
  attendees: number;
  avgSalary: number;
  startTime: Date;
  endTime?: Date;
  totalCost: number;
}

export const MAX_DAILY_TASKS = 5;
export const MAX_SUBTASKS_PER_TASK = 3;

// Priority colors for daily tasks (auto-assigned by order)
export const PRIORITY_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6']; // Red, Yellow, Green, Blue, Purple

// Theme presets
export const DARK_THEME: ThemeColors = {
  primary: '#e94560',
  background: '#16213e',
  cardBackground: '#1a1a2e',
  text: '#fff',
  textSecondary: '#8b8b8b',
  border: '#0f3460',
  success: '#2d6a4f',
  danger: '#e94560',
};

export const LIGHT_THEME: ThemeColors = {
  primary: '#e94560',
  background: '#f8f9fa',
  cardBackground: '#ffffff',
  text: '#1a1a2e',
  textSecondary: '#6c757d',
  border: '#dee2e6',
  success: '#2d6a4f',
  danger: '#e94560',
};

export const DEFAULT_SETTINGS: UserSettings = {
  defaultSalary: 75000,
  notifications: true,
  theme: 'dark',
};

// Focus Timer Types
export type FocusPresetType = 'classic' | 'deepwork' | 'sprint';
export type FocusState = 'working' | 'shortBreak' | 'longBreak';

export interface FocusPreset {
  name: string;
  workDuration: number; // milliseconds
  shortBreakDuration: number; // milliseconds
  longBreakDuration: number; // milliseconds
  longBreakAfter: number; // number of pomodoros before long break
}

export interface FocusSession {
  id: string;
  startTime: number; // timestamp
  duration: number; // milliseconds
  mode: FocusPresetType;
  linkedTaskId?: string;
  state: FocusState;
  pomodorosCompleted: number;
  breakStartTime?: number;
  currentSessionInCycle: number; // 1-4 for classic, 1-3 for deepwork
}

export const FOCUS_PRESETS: Record<FocusPresetType, FocusPreset> = {
  classic: {
    name: 'Classic Pomodoro',
    workDuration: 25 * 60 * 1000, // 25 minutes
    shortBreakDuration: 5 * 60 * 1000, // 5 minutes
    longBreakDuration: 15 * 60 * 1000, // 15 minutes
    longBreakAfter: 4,
  },
  deepwork: {
    name: 'Deep Work',
    workDuration: 50 * 60 * 1000, // 50 minutes
    shortBreakDuration: 10 * 60 * 1000, // 10 minutes
    longBreakDuration: 20 * 60 * 1000, // 20 minutes
    longBreakAfter: 3,
  },
  sprint: {
    name: 'Sprint',
    workDuration: 15 * 60 * 1000, // 15 minutes
    shortBreakDuration: 5 * 60 * 1000, // 5 minutes
    longBreakDuration: 15 * 60 * 1000, // 15 minutes
    longBreakAfter: 4,
  },
};
