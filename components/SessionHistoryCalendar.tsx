import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { analytics, SessionHistoryEntry } from '../services/analytics';

export const SessionHistoryCalendar: React.FC = () => {
  const [history, setHistory] = useState<SessionHistoryEntry[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await analytics.getAnalytics();
    setHistory(data.sessionHistory || []);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getSessionsForDate = (dateStr: string): SessionHistoryEntry[] => {
    return history.filter(s => s.date === dateStr);
  };

  const formatDateKey = (year: number, month: number, day: number): string => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const handlePrevMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1));
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(selectedMonth);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    // Actual days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDateKey(year, month, day);
      const sessions = getSessionsForDate(dateKey);
      const hasActivity = sessions.length > 0;
      const totalSessions = sessions.length;

      days.push(
        <View key={day} style={styles.dayCell}>
          <View style={[
            styles.dayContent,
            hasActivity && styles.dayWithActivity
          ]}>
            <Text style={styles.dayNumber}>{day}</Text>
            {hasActivity && (
              <View style={styles.activityIndicator}>
                <Text style={styles.activityCount}>{totalSessions}</Text>
              </View>
            )}
          </View>
        </View>
      );
    }

    return days;
  };

  const getMonthStats = () => {
    const { year, month } = getDaysInMonth(selectedMonth);
    const monthSessions = history.filter(s => {
      const sessionDate = new Date(s.date);
      return sessionDate.getFullYear() === year && sessionDate.getMonth() === month;
    });

    const totalSessions = monthSessions.length;
    const totalMinutes = monthSessions.reduce((sum, s) => sum + s.duration, 0);
    const byPreset = {
      classic: monthSessions.filter(s => s.preset === 'classic').length,
      deepwork: monthSessions.filter(s => s.preset === 'deepwork').length,
      sprint: monthSessions.filter(s => s.preset === 'sprint').length,
    };

    return { totalSessions, totalMinutes, byPreset };
  };

  const stats = getMonthStats();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>
        <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Month Stats */}
      <View style={styles.monthStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalSessions}</Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{Math.floor(stats.totalMinutes / 60)}h {stats.totalMinutes % 60}m</Text>
          <Text style={styles.statLabel}>Total Time</Text>
        </View>
      </View>

      {/* Weekday Headers */}
      <View style={styles.weekdayRow}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <View key={i} style={styles.weekdayCell}>
            <Text style={styles.weekdayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {renderCalendar()}
      </View>

      {/* Preset Breakdown */}
      {stats.totalSessions > 0 && (
        <View style={styles.presetBreakdown}>
          <Text style={styles.breakdownTitle}>This Month</Text>
          <View style={styles.presetRow}>
            {stats.byPreset.classic > 0 && (
              <View style={styles.presetChip}>
                <Text style={styles.presetText}>Classic: {stats.byPreset.classic}</Text>
              </View>
            )}
            {stats.byPreset.deepwork > 0 && (
              <View style={styles.presetChip}>
                <Text style={styles.presetText}>Deep Work: {stats.byPreset.deepwork}</Text>
              </View>
            )}
            {stats.byPreset.sprint > 0 && (
              <View style={styles.presetChip}>
                <Text style={styles.presetText}>Sprint: {stats.byPreset.sprint}</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#0f3460',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  monthStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#16213e',
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e94560',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8b8b8b',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8b8b8b',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%', // 100% / 7 days
    aspectRatio: 1,
    padding: 2,
  },
  dayContent: {
    flex: 1,
    backgroundColor: '#16213e',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dayWithActivity: {
    backgroundColor: 'rgba(233, 69, 96, 0.2)',
    borderWidth: 1,
    borderColor: '#e94560',
  },
  dayNumber: {
    fontSize: 12,
    color: '#fff',
  },
  activityIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#e94560',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  activityCount: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#fff',
  },
  presetBreakdown: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b8b8b',
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    backgroundColor: '#16213e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  presetText: {
    fontSize: 12,
    color: '#fff',
  },
});
