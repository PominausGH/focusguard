import { AnalyticsData, SessionHistoryEntry } from '../services/analytics';
import { Platform } from 'react-native';

export const exportAnalyticsToCSV = async (data: AnalyticsData): Promise<void> => {
  try {
    // Generate CSV content
    const csv = generateCSV(data);

    if (Platform.OS === 'web') {
      // Web: Download via blob
      downloadCSVWeb(csv, `focusshield-analytics-${new Date().toISOString().split('T')[0]}.csv`);
    } else {
      // Mobile: Use Expo Sharing
      await downloadCSVMobile(
        csv,
        `focusshield-analytics-${new Date().toISOString().split('T')[0]}.csv`
      );
    }
  } catch (error) {
    console.error('Error exporting CSV:', error);
    throw new Error('Failed to export analytics');
  }
};

const generateCSV = (data: AnalyticsData): string => {
  let csv = '';

  // Summary Section
  csv += 'FocusShield Analytics Export\n';
  csv += `Export Date,${new Date().toISOString()}\n\n`;

  // Overall Stats
  csv += 'OVERALL STATISTICS\n';
  csv += 'Metric,Value\n';
  csv += `Total Tasks Completed,${data.tasksCompleted.total}\n`;
  csv += `Total Pomodoros,${data.pomodoros.totalCompleted}\n`;
  csv += `Total Focus Time (minutes),${data.pomodoros.totalFocusTime}\n`;
  csv += `Current Streak (days),${data.streaks.currentStreak}\n`;
  csv += `Longest Streak (days),${data.streaks.longestStreak}\n`;
  csv += `Total Meetings Tracked,${data.meetingSessions.totalSessions}\n`;
  csv += `Total Meeting Cost,$${data.meetingSessions.totalCostCalculated.toFixed(2)}\n`;
  csv += `Total Meeting Time (seconds),${data.meetingSessions.totalTimeTracked}\n\n`;

  // Pomodoro Breakdown
  csv += 'POMODORO BREAKDOWN BY PRESET\n';
  csv += 'Preset,Count\n';
  csv += `Classic,${data.pomodoros.byPreset.classic}\n`;
  csv += `Deep Work,${data.pomodoros.byPreset.deepwork}\n`;
  csv += `Sprint,${data.pomodoros.byPreset.sprint}\n\n`;

  // Session History
  if (data.sessionHistory && data.sessionHistory.length > 0) {
    csv += 'SESSION HISTORY\n';
    csv += 'Date,Preset,Duration (minutes),Completed At,Linked Task\n';

    // Sort by date (most recent first)
    const sortedSessions = [...data.sessionHistory].sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );

    sortedSessions.forEach((session) => {
      const taskTitle = session.linkedTaskTitle
        ? `"${session.linkedTaskTitle.replace(/"/g, '""')}"`
        : '';
      csv += `${session.date},${session.preset},${session.duration},${session.completedAt},${taskTitle}\n`;
    });
  }

  return csv;
};

const downloadCSVWeb = (csvContent: string, filename: string) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const downloadCSVMobile = async (csvContent: string, filename: string) => {
  // Dynamic import to avoid web bundle issues
  const [FileSystemModule, SharingModule] = await Promise.all([
    import('expo-file-system'),
    import('expo-sharing'),
  ]);

  const FileSystem = FileSystemModule.default || FileSystemModule;
  const Sharing = SharingModule.default || SharingModule;

  if (!(FileSystem as any).documentDirectory) {
    throw new Error('Document directory not available');
  }

  const fileUri = `${(FileSystem as any).documentDirectory}${filename}`;

  await (FileSystem as any).writeAsStringAsync(fileUri, csvContent);

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri);
  } else {
    throw new Error('Sharing is not available on this device');
  }
};
