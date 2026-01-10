import AsyncStorage from '@react-native-async-storage/async-storage';

const ANALYTICS_KEY = '@focusguard_analytics';

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
};

class AnalyticsService {
  private data: AnalyticsData = DEFAULT_ANALYTICS;
  private loaded: boolean = false;

  async load(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(ANALYTICS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Migrate old data that doesn't have pomodoros field
        this.data = {
          ...DEFAULT_ANALYTICS,
          ...parsed,
          pomodoros: parsed.pomodoros || DEFAULT_ANALYTICS.pomodoros,
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

  async trackPomodoro(preset: 'classic' | 'deepwork' | 'sprint', durationMinutes: number, taskId?: string): Promise<void> {
    await this.ensureLoaded();
    this.data.pomodoros.totalCompleted += 1;
    this.data.pomodoros.totalFocusTime += durationMinutes;
    this.data.pomodoros.byPreset[preset] += 1;
    this.data.pomodoros.lastSessionDate = new Date().toISOString();
    await this.save();
  }

  async getAnalytics(): Promise<AnalyticsData> {
    await this.ensureLoaded();
    return { ...this.data };
  }

  async reset(): Promise<void> {
    this.data = DEFAULT_ANALYTICS;
    await this.save();
  }
}

export const analytics = new AnalyticsService();
