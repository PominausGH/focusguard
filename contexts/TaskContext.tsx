import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, startOfDay } from 'date-fns';
import { Task, MAX_DAILY_TASKS } from '../types';
import { useAuth } from './AuthContext';
import { analytics } from '../services/analytics';
import { tasksApi } from '../services/api';

// Demo mode - set to false to use API backend
const DEMO_MODE = false;

// Simple ID generator that works on web
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const TASKS_KEY = '@focusshield_tasks';

// Get today's date in local timezone as YYYY-MM-DD
const getTodayDateString = (): string => {
  return format(startOfDay(new Date()), 'yyyy-MM-dd');
};

interface TaskContextType {
  tasks: Task[];
  loading: boolean;
  canAddTask: boolean;
  completedCount: number;
  addTask: (title: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  uncompleteTask: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  addFocusTime: (taskId: string, minutes: number) => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter to today's tasks only (memoized to prevent unnecessary re-renders)
  const todayStr = getTodayDateString();
  const tasks = useMemo(() => {
    return allTasks.filter((t) => t.date === todayStr);
  }, [allTasks, todayStr]);

  useEffect(() => {
    if (user) {
      if (DEMO_MODE) {
        loadTasksLocal();
      } else {
        loadTasksApi();
      }
    } else {
      setAllTasks([]);
      setLoading(false);
    }
  }, [user]);

  // Demo mode - local storage
  const loadTasksLocal = async () => {
    try {
      const stored = await AsyncStorage.getItem(TASKS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const tasksWithDates = parsed.map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
        }));
        setAllTasks(tasksWithDates);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTasksLocal = async (tasksToSave: Task[]) => {
    try {
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasksToSave));
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  };

  // API mode
  const loadTasksApi = async () => {
    try {
      const response = await tasksApi.getToday();
      if (response.data) {
        setAllTasks(response.data);
      } else if (response.error) {
        console.error('Error loading tasks:', response.error);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const canAddTask = tasks.length < MAX_DAILY_TASKS;
  const completedCount = tasks.filter((t) => t.completed).length;

  const addTask = async (title: string) => {
    if (!user || !canAddTask) return;

    if (DEMO_MODE) {
      const newTask: Task = {
        id: generateId(),
        userId: user.uid,
        title,
        completed: false,
        createdAt: new Date(),
        date: getTodayDateString(),
      };
      const updated = [...allTasks, newTask];
      setAllTasks(updated);
      await saveTasksLocal(updated);
    } else {
      const response = await tasksApi.create(title);
      if (response.data) {
        setAllTasks((prev) => [...prev, response.data!]);
      } else if (response.error) {
        console.error('Error adding task:', response.error);
        throw new Error(response.error);
      }
    }
  };

  const completeTask = async (taskId: string) => {
    if (DEMO_MODE) {
      const updated = allTasks.map((t) =>
        t.id === taskId ? { ...t, completed: true, completedAt: new Date() } : t
      );
      setAllTasks(updated);
      await saveTasksLocal(updated);
    } else {
      const response = await tasksApi.complete(taskId);
      if (response.data) {
        setAllTasks((prev) => prev.map((t) => (t.id === taskId ? response.data! : t)));
      } else if (response.error) {
        console.error('Error completing task:', response.error);
      }
    }

    // Track task completion in analytics
    await analytics.trackTaskCompleted();
  };

  const uncompleteTask = async (taskId: string) => {
    if (DEMO_MODE) {
      const updated = allTasks.map((t) =>
        t.id === taskId ? { ...t, completed: false, completedAt: undefined } : t
      );
      setAllTasks(updated);
      await saveTasksLocal(updated);
    } else {
      const response = await tasksApi.uncomplete(taskId);
      if (response.data) {
        setAllTasks((prev) => prev.map((t) => (t.id === taskId ? response.data! : t)));
      } else if (response.error) {
        console.error('Error uncompleting task:', response.error);
      }
    }
  };

  const deleteTask = async (taskId: string) => {
    if (DEMO_MODE) {
      const updated = allTasks.filter((t) => t.id !== taskId);
      setAllTasks(updated);
      await saveTasksLocal(updated);
    } else {
      const response = await tasksApi.delete(taskId);
      if (!response.error) {
        setAllTasks((prev) => prev.filter((t) => t.id !== taskId));
      } else {
        console.error('Error deleting task:', response.error);
      }
    }
  };

  const updateTask = async (task: Task) => {
    if (DEMO_MODE) {
      const updated = allTasks.map((t) => (t.id === task.id ? task : t));
      setAllTasks(updated);
      await saveTasksLocal(updated);
    } else {
      const response = await tasksApi.update(task.id, task);
      if (response.data) {
        setAllTasks((prev) => prev.map((t) => (t.id === task.id ? response.data! : t)));
      } else if (response.error) {
        console.error('Error updating task:', response.error);
      }
    }
  };

  const addFocusTime = async (taskId: string, minutes: number) => {
    if (DEMO_MODE) {
      const updated = allTasks.map((t) =>
        t.id === taskId ? { ...t, focusTime: (t.focusTime || 0) + minutes } : t
      );
      setAllTasks(updated);
      await saveTasksLocal(updated);
    } else {
      const response = await tasksApi.addFocusTime(taskId, minutes);
      if (response.data) {
        setAllTasks((prev) => prev.map((t) => (t.id === taskId ? response.data! : t)));
      } else if (response.error) {
        console.error('Error adding focus time:', response.error);
      }
    }
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        loading,
        canAddTask,
        completedCount,
        addTask,
        completeTask,
        uncompleteTask,
        deleteTask,
        updateTask,
        addFocusTime,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
