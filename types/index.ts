export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  createdAt: Date;
  settings: UserSettings;
}

export interface UserSettings {
  defaultSalary: number;
  notifications: boolean;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
  date: string; // YYYY-MM-DD for daily grouping
}

export interface MeetingSession {
  id: string;
  attendees: number;
  avgSalary: number;
  startTime: Date;
  endTime?: Date;
  totalCost: number;
}

export const MAX_DAILY_TASKS = 3;

export const DEFAULT_SETTINGS: UserSettings = {
  defaultSalary: 75000,
  notifications: true,
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
