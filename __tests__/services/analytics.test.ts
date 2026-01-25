// Re-import analytics for each test to get fresh instance
let analytics: typeof import('../../services/analytics').analytics;
let AsyncStorage: typeof import('@react-native-async-storage/async-storage').default;

beforeEach(async () => {
  // Reset modules to get fresh instances
  jest.resetModules();

  // Re-require the modules
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
  const analyticsModule = require('../../services/analytics');
  analytics = analyticsModule.analytics;

  // Clear mock and reset analytics
  jest.clearAllMocks();
  await analytics.reset();
});

describe('AnalyticsService', () => {
  describe('trackMeetingSession', () => {
    it('should track meeting session with cost and time', async () => {
      await analytics.trackMeetingSession(100.5, 3600);

      const data = await analytics.getAnalytics();
      expect(data.meetingSessions.totalSessions).toBe(1);
      expect(data.meetingSessions.totalCostCalculated).toBe(100.5);
      expect(data.meetingSessions.totalTimeTracked).toBe(3600);
      expect(data.meetingSessions.lastSessionDate).not.toBeNull();
    });

    it('should accumulate multiple meeting sessions', async () => {
      await analytics.trackMeetingSession(50, 1800);
      await analytics.trackMeetingSession(75, 2700);

      const data = await analytics.getAnalytics();
      expect(data.meetingSessions.totalSessions).toBe(2);
      expect(data.meetingSessions.totalCostCalculated).toBe(125);
      expect(data.meetingSessions.totalTimeTracked).toBe(4500);
    });
  });

  describe('trackMeetingShare', () => {
    it('should increment share clicks', async () => {
      await analytics.trackMeetingShare();
      await analytics.trackMeetingShare();

      const data = await analytics.getAnalytics();
      expect(data.meetingSessions.shareClicks).toBe(2);
    });
  });

  describe('trackTaskCompleted', () => {
    it('should track task completion', async () => {
      await analytics.trackTaskCompleted();

      const data = await analytics.getAnalytics();
      expect(data.tasksCompleted.total).toBe(1);
      expect(data.tasksCompleted.lastCompletedDate).not.toBeNull();
    });

    it('should accumulate task completions', async () => {
      await analytics.trackTaskCompleted();
      await analytics.trackTaskCompleted();
      await analytics.trackTaskCompleted();

      const data = await analytics.getAnalytics();
      expect(data.tasksCompleted.total).toBe(3);
    });
  });

  describe('trackPomodoro', () => {
    it('should track pomodoro session', async () => {
      await analytics.trackPomodoro('classic', 25, 'Test Task');

      const data = await analytics.getAnalytics();
      expect(data.pomodoros.totalCompleted).toBe(1);
      expect(data.pomodoros.totalFocusTime).toBe(25);
      expect(data.pomodoros.byPreset.classic).toBe(1);
    });

    it('should track different preset types', async () => {
      await analytics.trackPomodoro('classic', 25);
      await analytics.trackPomodoro('deepwork', 50);
      await analytics.trackPomodoro('sprint', 15);

      const data = await analytics.getAnalytics();
      expect(data.pomodoros.byPreset.classic).toBe(1);
      expect(data.pomodoros.byPreset.deepwork).toBe(1);
      expect(data.pomodoros.byPreset.sprint).toBe(1);
      expect(data.pomodoros.totalFocusTime).toBe(90);
    });

    it('should add session to history', async () => {
      await analytics.trackPomodoro('classic', 25, 'My Task');

      const data = await analytics.getAnalytics();
      expect(data.sessionHistory.length).toBe(1);
      expect(data.sessionHistory[0].preset).toBe('classic');
      expect(data.sessionHistory[0].duration).toBe(25);
      expect(data.sessionHistory[0].linkedTaskTitle).toBe('My Task');
    });

    it('should start streak on first pomodoro', async () => {
      await analytics.trackPomodoro('classic', 25);

      const data = await analytics.getAnalytics();
      expect(data.streaks.currentStreak).toBe(1);
      expect(data.streaks.longestStreak).toBe(1);
    });
  });

  describe('getAnalytics', () => {
    it('should return default analytics when empty', async () => {
      const data = await analytics.getAnalytics();

      expect(data.meetingSessions.totalSessions).toBe(0);
      expect(data.tasksCompleted.total).toBe(0);
      expect(data.pomodoros.totalCompleted).toBe(0);
      expect(data.streaks.currentStreak).toBe(0);
    });

    it('should return a copy of the data', async () => {
      const data1 = await analytics.getAnalytics();
      const data2 = await analytics.getAnalytics();

      expect(data1).not.toBe(data2);
      expect(data1).toEqual(data2);
    });
  });

  describe('reset', () => {
    it('should reset all analytics data', async () => {
      // Get initial state
      const initialData = await analytics.getAnalytics();
      const initialSessions = initialData.meetingSessions.totalSessions;

      // Add some data
      await analytics.trackMeetingSession(100, 3600);
      await analytics.trackTaskCompleted();
      await analytics.trackPomodoro('classic', 25);

      // Verify data was added
      const afterTrack = await analytics.getAnalytics();
      expect(afterTrack.meetingSessions.totalSessions).toBe(initialSessions + 1);

      // Reset
      await analytics.reset();

      // Verify reset worked
      const afterReset = await analytics.getAnalytics();
      expect(afterReset.meetingSessions.totalSessions).toBe(0);
      expect(afterReset.tasksCompleted.total).toBe(0);
      expect(afterReset.pomodoros.totalCompleted).toBe(0);
    });
  });
});
