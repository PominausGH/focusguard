/**
 * API Service for FocusShield
 * Handles all HTTP communication with the backend
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Task, UserSettings } from '../types';

const TOKEN_KEY = '@focusshield_token';

// Use relative URL in production, localhost in dev
const getBaseUrl = (): string => {
  if (typeof window !== 'undefined' && window.location) {
    // In browser/web - use relative path (nginx will proxy)
    if (window.location.hostname !== 'localhost') {
      return '/api';
    }
  }
  // Development fallback
  return 'http://localhost:3011/api';
};

const API_BASE = getBaseUrl();

// Token management
let authToken: string | null = null;

export const setToken = async (token: string | null): Promise<void> => {
  authToken = token;
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
};

export const getToken = async (): Promise<string | null> => {
  if (authToken) return authToken;
  authToken = await AsyncStorage.getItem(TOKEN_KEY);
  return authToken;
};

export const clearToken = async (): Promise<void> => {
  authToken = null;
  await AsyncStorage.removeItem(TOKEN_KEY);
};

// HTTP helpers
interface ApiResponse<T> {
  data?: T;
  error?: string;
  errors?: Array<{ msg: string; path?: string }>;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = await getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle validation errors
      if (data.errors && Array.isArray(data.errors)) {
        return { error: data.errors.map((e: { msg: string }) => e.msg).join(', ') };
      }
      return { error: data.error || 'Request failed' };
    }

    return { data };
  } catch (err) {
    console.error('API request error:', err);
    return { error: 'Network error. Please check your connection.' };
  }
}

// Auth API
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    displayName: string;
    createdAt: string;
    settings: UserSettings;
  };
  token: string;
}

export const authApi = {
  async register(
    email: string,
    password: string,
    displayName: string
  ): Promise<ApiResponse<AuthResponse>> {
    return request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
  },

  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async getMe(): Promise<ApiResponse<AuthResponse['user']>> {
    return request<AuthResponse['user']>('/auth/me');
  },

  async updateSettings(
    settings: Partial<UserSettings>
  ): Promise<ApiResponse<AuthResponse['user']>> {
    return request<AuthResponse['user']>('/auth/settings', {
      method: 'PATCH',
      body: JSON.stringify({ settings }),
    });
  },
};

// Tasks API
export interface TaskResponse {
  id: string;
  user_id: string;
  title: string;
  completed: boolean;
  created_at: string;
  completed_at: string | null;
  date: string;
  tags: string[] | null;
  focus_time: number | null;
  estimated_pomodoros: number | null;
  subtasks: Array<{ id: string; title: string; completed: boolean }> | null;
}

// Convert API response to frontend Task type
const toTask = (t: TaskResponse): Task => ({
  id: String(t.id),
  userId: String(t.user_id),
  title: t.title,
  completed: t.completed,
  createdAt: new Date(t.created_at),
  completedAt: t.completed_at ? new Date(t.completed_at) : undefined,
  date: t.date.split('T')[0], // Extract YYYY-MM-DD from ISO string
  tags: t.tags || undefined,
  focusTime: t.focus_time || undefined,
  estimatedPomodoros: t.estimated_pomodoros || undefined,
  subtasks: t.subtasks || undefined,
});

export const tasksApi = {
  async getToday(): Promise<ApiResponse<Task[]>> {
    // Send local date to avoid timezone issues
    const today = new Date();
    const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const response = await request<TaskResponse[]>(`/tasks?date=${localDate}`);
    if (response.error) return { error: response.error };
    return { data: response.data?.map(toTask) };
  },

  async create(title: string): Promise<ApiResponse<Task>> {
    // Send local date to avoid timezone issues
    const today = new Date();
    const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const response = await request<TaskResponse>('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title, date: localDate }),
    });
    if (response.error) return { error: response.error };
    return { data: response.data ? toTask(response.data) : undefined };
  },

  async update(taskId: string, updates: Partial<Task>): Promise<ApiResponse<Task>> {
    // Convert frontend field names to API field names
    const apiUpdates: Record<string, unknown> = {};
    if (updates.title !== undefined) apiUpdates.title = updates.title;
    if (updates.completed !== undefined) apiUpdates.completed = updates.completed;
    if (updates.tags !== undefined) apiUpdates.tags = updates.tags;
    if (updates.focusTime !== undefined) apiUpdates.focus_time = updates.focusTime;
    if (updates.estimatedPomodoros !== undefined)
      apiUpdates.estimated_pomodoros = updates.estimatedPomodoros;
    if (updates.subtasks !== undefined) apiUpdates.subtasks = updates.subtasks;

    const response = await request<TaskResponse>(`/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(apiUpdates),
    });
    if (response.error) return { error: response.error };
    return { data: response.data ? toTask(response.data) : undefined };
  },

  async delete(taskId: string): Promise<ApiResponse<void>> {
    return request<void>(`/tasks/${taskId}`, {
      method: 'DELETE',
    });
  },

  async complete(taskId: string): Promise<ApiResponse<Task>> {
    return this.update(taskId, { completed: true });
  },

  async uncomplete(taskId: string): Promise<ApiResponse<Task>> {
    return this.update(taskId, { completed: false });
  },

  async addFocusTime(taskId: string, minutes: number): Promise<ApiResponse<Task>> {
    const response = await request<TaskResponse>(`/tasks/${taskId}/focus`, {
      method: 'POST',
      body: JSON.stringify({ minutes }),
    });
    if (response.error) return { error: response.error };
    return { data: response.data ? toTask(response.data) : undefined };
  },
};

// Analytics API
export interface FocusSessionRequest {
  taskId?: string;
  duration: number;
  mode: string;
  pomodorosCompleted: number;
}

export interface MeetingSessionRequest {
  attendees: number;
  avgSalary: number;
  duration: number;
  totalCost: number;
}

export interface AnalyticsSummary {
  totalFocusMinutes: number;
  totalPomodoros: number;
  totalMeetingCost: number;
  totalMeetingMinutes: number;
  tasksCompleted: number;
}

export const analyticsApi = {
  async trackFocusSession(session: FocusSessionRequest): Promise<ApiResponse<void>> {
    return request<void>('/analytics/focus', {
      method: 'POST',
      body: JSON.stringify({
        task_id: session.taskId,
        duration: session.duration,
        mode: session.mode,
        pomodoros_completed: session.pomodorosCompleted,
      }),
    });
  },

  async trackMeetingSession(session: MeetingSessionRequest): Promise<ApiResponse<void>> {
    return request<void>('/analytics/meeting', {
      method: 'POST',
      body: JSON.stringify({
        attendees: session.attendees,
        avg_salary: session.avgSalary,
        duration: session.duration,
        total_cost: session.totalCost,
      }),
    });
  },

  async getSummary(days: number = 30): Promise<ApiResponse<AnalyticsSummary>> {
    return request<AnalyticsSummary>(`/analytics/summary?days=${days}`);
  },
};

export default {
  auth: authApi,
  tasks: tasksApi,
  analytics: analyticsApi,
  setToken,
  getToken,
  clearToken,
};
