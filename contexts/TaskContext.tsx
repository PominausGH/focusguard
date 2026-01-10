import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, startOfDay } from 'date-fns';
import { Task, MAX_DAILY_TASKS } from '../types';
import { useAuth } from './AuthContext';
import { analytics } from '../services/analytics';

// Simple ID generator that works on web
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const TASKS_KEY = '@focusguard_tasks';

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
    return allTasks.filter(t => t.date === todayStr);
  }, [allTasks, todayStr]);

  useEffect(() => {
    if (user) {
      loadTasks();
    } else {
      setAllTasks([]);
      setLoading(false);
    }
  }, [user]);

  const loadTasks = async () => {
    try {
      const stored = await AsyncStorage.getItem(TASKS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
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

  const saveTasks = async (tasksToSave: Task[]) => {
    try {
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasksToSave));
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  };

  const canAddTask = tasks.length < MAX_DAILY_TASKS;
  const completedCount = tasks.filter(t => t.completed).length;

  const addTask = async (title: string) => {
    if (!user || !canAddTask) return;

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
    await saveTasks(updated);
  };

  const completeTask = async (taskId: string) => {
    const updated = allTasks.map(t =>
      t.id === taskId ? { ...t, completed: true, completedAt: new Date() } : t
    );
    setAllTasks(updated);
    await saveTasks(updated);

    // Track task completion in analytics
    await analytics.trackTaskCompleted();
  };

  const uncompleteTask = async (taskId: string) => {
    const updated = allTasks.map(t =>
      t.id === taskId ? { ...t, completed: false, completedAt: undefined } : t
    );
    setAllTasks(updated);
    await saveTasks(updated);
  };

  const deleteTask = async (taskId: string) => {
    const updated = allTasks.filter(t => t.id !== taskId);
    setAllTasks(updated);
    await saveTasks(updated);
  };

  const addFocusTime = async (taskId: string, minutes: number) => {
    const updated = allTasks.map(t =>
      t.id === taskId ? { ...t, focusTime: (t.focusTime || 0) + minutes } : t
    );
    setAllTasks(updated);
    await saveTasks(updated);
  };

  return (
    <TaskContext.Provider value={{
      tasks,
      loading,
      canAddTask,
      completedCount,
      addTask,
      completeTask,
      uncompleteTask,
      deleteTask,
      addFocusTime,
    }}>
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
