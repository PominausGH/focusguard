/**
 * Analytics Service for FocusShield
 *
 * Tracks user engagement metrics including:
 * - Meeting sessions and costs
 * - Task completions
 * - Pomodoro/focus sessions
 * - Streaks and session history
 *
 * All data is stored locally using AsyncStorage.
 * @module services/analytics
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/** Storage key for analytics data */
const ANALYTICS_KEY = '@focusshield_analytics';

export interface SessionHistoryEntry {
  id: string;
  date: string; // YYYY-MM-DD
  preset: 'classic' | 'deepwork' | 'sprint';
  duration: number; // minutes
  completedAt: string; // ISO timestamp
  linkedTaskTitle?: string;
}

export interface AnalyticsData {
  meetingSessions: {
    totalSessions: number;
    totalCostCalculated: number;
    totalTimeTracked: number; // in seconds
    shareClicks: number;
    lastSessionDate: string | null;
  };
  tasksCompleted: {
    total: number;
    lastCompletedDate: string | null;
  };
  pomodoros: {
    totalCompleted: number;
    totalFocusTime: number; // in minutes
    byPreset: {
      classic: number;
      deepwork: number;
      sprint: number;
    };
    lastSessionDate: string | null;
  };
  streaks: {
    currentStreak: number; // consecutive days with at least 1 pomodoro
    longestStreak: number;
    lastActiveDate: string | null; // YYYY-MM-DD
  };
  sessionHistory: SessionHistoryEntry[]; // detailed session history
}

const DEFAULT_ANALYTICS: AnalyticsData = {
  meetingSessions: {
    totalSessions: 0,
    totalCostCalculated: 0,
    totalTimeTracked: 0,
    shareClicks: 0,
    lastSessionDate: null,
  },
  tasksCompleted: {
    total: 0,
    lastCompletedDate: null,
  },
  pomodoros: {
    totalCompleted: 0,
    totalFocusTime: 0,
    byPreset: {
      classic: 0,
      deepwork: 0,
      sprint: 0,
    },
    lastSessionDate: null,
  },
  streaks: {
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null,
  },
  sessionHistory: [],
};

/**
 * Analytics Service class for tracking user engagement.
 * Singleton instance exported as `analytics`.
 */
class AnalyticsService {
  private data: AnalyticsData = DEFAULT_ANALYTICS;
  private loaded: boolean = false;

  /**
   * Load analytics data from AsyncStorage.
   * Called automatically when accessing analytics methods.
   */
  async load(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(ANALYTICS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Migrate old data that doesn't have new fields
        this.data = {
          ...DEFAULT_ANALYTICS,
          ...parsed,
          pomodoros: parsed.pomodoros || DEFAULT_ANALYTICS.pomodoros,
          streaks: parsed.streaks || DEFAULT_ANALYTICS.streaks,
          sessionHistory: parsed.sessionHistory || DEFAULT_ANALYTICS.sessionHistory,
        };
      }
      this.loaded = true;
    } catch (error) {
      console.error('Failed to load analytics:', error);
      this.data = DEFAULT_ANALYTICS;
      this.loaded = true;
    }
  }

  private async save(): Promise<void> {
    try {
      await AsyncStorage.setItem(ANALYTICS_KEY, JSON.stringify(this.data));
    } catch (error) {
      console.error('Failed to save analytics:', error);
    }
  }

  private async ensureLoaded(): Promise<void> {
    if (!this.loaded) {
      await this.load();
    }
  }

  async trackMeetingSession(cost: number, timeInSeconds: number): Promise<void> {
    await this.ensureLoaded();
    this.data.meetingSessions.totalSessions += 1;
    this.data.meetingSessions.totalCostCalculated += cost;
    this.data.meetingSessions.totalTimeTracked += timeInSeconds;
    this.data.meetingSessions.lastSessionDate = new Date().toISOString();
    await this.save();
  }

  async trackMeetingShare(): Promise<void> {
    await this.ensureLoaded();
    this.data.meetingSessions.shareClicks += 1;
    await this.save();
  }

  async trackTaskCompleted(): Promise<void> {
    await this.ensureLoaded();
    this.data.tasksCompleted.total += 1;
    this.data.tasksCompleted.lastCompletedDate = new Date().toISOString();
    await this.save();
  }

  async trackPomodoro(
    preset: 'classic' | 'deepwork' | 'sprint',
    durationMinutes: number,
    taskTitle?: string
  ): Promise<void> {
    await this.ensureLoaded();

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const lastActiveDate = this.data.streaks.lastActiveDate;

    // Update streak
    if (!lastActiveDate) {
      // First ever pomodoro
      this.data.streaks.currentStreak = 1;
      this.data.streaks.longestStreak = 1;
    } else if (lastActiveDate === today) {
      // Already active today, streak continues (no change)
    } else {
      // Check if it's consecutive day
      const lastDate = new Date(lastActiveDate);
      const todayDate = new Date(today);
      const diffTime = todayDate.getTime() - lastDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day
        this.data.streaks.currentStreak += 1;
        if (this.data.streaks.currentStreak > this.data.streaks.longestStreak) {
          this.data.streaks.longestStreak = this.data.streaks.currentStreak;
        }
      } else {
        // Streak broken, reset to 1
        this.data.streaks.currentStreak = 1;
      }
    }

    this.data.streaks.lastActiveDate = today;
    this.data.pomodoros.totalCompleted += 1;
    this.data.pomodoros.totalFocusTime += durationMinutes;
    this.data.pomodoros.byPreset[preset] += 1;
    this.data.pomodoros.lastSessionDate = new Date().toISOString();

    // Add to session history
    const sessionEntry: SessionHistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: today,
      preset,
      duration: durationMinutes,
      completedAt: new Date().toISOString(),
      linkedTaskTitle: taskTitle,
    };
    this.data.sessionHistory.push(sessionEntry);

    await this.save();
  }

  async getAnalytics(): Promise<AnalyticsData> {
    await this.ensureLoaded();
    return { ...this.data };
  }

  async reset(): Promise<void> {
    this.data = JSON.parse(JSON.stringify(DEFAULT_ANALYTICS));
    this.loaded = true;
    await this.save();
  }
}

export const analytics = new AnalyticsService();
