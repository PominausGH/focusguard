import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { analytics, AnalyticsData } from '../services/analytics';
import { useTheme } from '../contexts/ThemeContext';
import { useThemedStyles } from '../hooks/useThemedStyles';

export const AnalyticsDashboard: React.FC = () => {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const analyticsData = await analytics.getAnalytics();
      setData(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleRefresh = () => {
    setLoading(true);
    loadAnalytics();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  if (!data) {
    return null;
  }

  const { meetingSessions, tasksCompleted, pomodoros, streaks } = data;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Impact</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh-outline" size={20} color="#8b8b8b" />
        </TouchableOpacity>
      </View>

      {/* Streak Display */}
      {streaks.currentStreak > 0 && (
        <View style={styles.streakCard}>
          <View style={styles.streakContent}>
            <Ionicons name="flame" size={40} color="#f39c12" />
            <View style={styles.streakText}>
              <Text style={styles.streakNumber}>{streaks.currentStreak}</Text>
              <Text style={styles.streakLabel}>Day Streak</Text>
            </View>
          </View>
          {streaks.longestStreak > streaks.currentStreak && (
            <Text style={styles.streakBest}>
              Best: {streaks.longestStreak} days 🏆
            </Text>
          )}
        </View>
      )}

      {/* Meeting Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="timer" size={24} color="#e94560" />
          </View>
          <Text style={styles.statValue}>{meetingSessions.totalSessions}</Text>
          <Text style={styles.statLabel}>Meetings Tracked</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="cash" size={24} color="#e94560" />
          </View>
          <Text style={styles.statValue}>
            {formatCurrency(meetingSessions.totalCostCalculated)}
          </Text>
          <Text style={styles.statLabel}>Total Cost</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="time" size={24} color="#e94560" />
          </View>
          <Text style={styles.statValue}>
            {formatTime(meetingSessions.totalTimeTracked)}
          </Text>
          <Text style={styles.statLabel}>Time Tracked</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="share-social" size={24} color="#e94560" />
          </View>
          <Text style={styles.statValue}>{meetingSessions.shareClicks}</Text>
          <Text style={styles.statLabel}>Shares</Text>
        </View>
      </View>

      {/* Task Stats */}
      <View style={styles.taskStatsCard}>
        <View style={styles.taskStatRow}>
          <View style={styles.taskStatLeft}>
            <Ionicons name="checkmark-circle" size={32} color="#2d6a4f" />
            <View style={styles.taskStatText}>
              <Text style={styles.taskStatValue}>{tasksCompleted.total}</Text>
              <Text style={styles.taskStatLabel}>Tasks Completed</Text>
            </View>
          </View>
          {tasksCompleted.lastCompletedDate && (
            <Text style={styles.taskStatDate}>
              Last: {new Date(tasksCompleted.lastCompletedDate).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>

      {/* Pomodoro Stats */}
      {pomodoros.totalCompleted > 0 && (
        <View style={styles.pomodoroSection}>
          <Text style={styles.sectionTitle}>Focus Sessions</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="timer" size={24} color="#2d6a4f" />
              </View>
              <Text style={styles.statValue}>{pomodoros.totalCompleted}</Text>
              <Text style={styles.statLabel}>Pomodoros</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="flash" size={24} color="#2d6a4f" />
              </View>
              <Text style={styles.statValue}>{Math.floor(pomodoros.totalFocusTime)}</Text>
              <Text style={styles.statLabel}>Focus Minutes</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="flame" size={24} color="#f39c12" />
              </View>
              <Text style={styles.statValue}>{pomodoros.byPreset.classic}</Text>
              <Text style={styles.statLabel}>Classic</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="trending-up" size={24} color="#8e44ad" />
              </View>
              <Text style={styles.statValue}>{pomodoros.byPreset.deepwork}</Text>
              <Text style={styles.statLabel}>Deep Work</Text>
            </View>
          </View>

          {pomodoros.lastSessionDate && (
            <Text style={styles.lastSessionText}>
              Last session: {new Date(pomodoros.lastSessionDate).toLocaleDateString()}
            </Text>
          )}
        </View>
      )}

      {/* Insights */}
      {meetingSessions.totalSessions > 0 && (
        <View style={styles.insightCard}>
          <Ionicons name="bulb" size={20} color="#e94560" />
          <Text style={styles.insightText}>
            {meetingSessions.totalSessions === 1
              ? "You've tracked your first meeting! Keep it up."
              : meetingSessions.totalCostCalculated > 1000
              ? `Wow! You've tracked over ${formatCurrency(meetingSessions.totalCostCalculated)} in meeting costs.`
              : `Average meeting cost: ${formatCurrency(
                  meetingSessions.totalCostCalculated / meetingSessions.totalSessions
                )}`}
          </Text>
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  refreshButton: {
    padding: 8,
  },
  loadingText: {
    color: colors.textSecondary,
    textAlign: 'center',
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  taskStatsCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  taskStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskStatLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  taskStatText: {
    justifyContent: 'center',
  },
  taskStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  taskStatLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  taskStatDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  insightCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  pomodoroSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  lastSessionText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  streakCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#f39c12',
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  streakText: {
    flex: 1,
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#f39c12',
  },
  streakLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  streakBest: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'right',
  },
});
