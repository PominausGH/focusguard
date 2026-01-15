import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { AnalyticsDashboard } from '../../components/AnalyticsDashboard';
import { MusicLinksManager } from '../../components/MusicLinksManager';
import { SessionHistoryCalendar } from '../../components/SessionHistoryCalendar';
import { analytics } from '../../services/analytics';
import { exportAnalyticsToCSV } from '../../utils/exportCSV';
import { MusicLink, ThemeMode } from '../../types';
import { useThemedStyles } from '../../hooks/useThemedStyles';

export default function SettingsScreen() {
  const { user, signOut, updateSettings } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [defaultSalary, setDefaultSalary] = useState(
    (user?.settings?.defaultSalary || 75000).toString()
  );
  const [notifications, setNotifications] = useState(
    user?.settings?.notifications ?? true
  );
  const [musicLinks, setMusicLinks] = useState<MusicLink[]>(
    user?.settings?.musicLinks || []
  );
  const [theme, setTheme] = useState<ThemeMode>(
    user?.settings?.theme || 'dark'
  );
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleSaveSettings = async () => {
    if (!user) return;

    setSaving(true);
    try {
      updateSettings({
        defaultSalary: parseInt(defaultSalary) || 75000,
        notifications,
        musicLinks,
        theme,
      });
      Alert.alert('Success', 'Settings saved! Reload the app to see theme changes.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateMusicLinks = (links: MusicLink[]) => {
    setMusicLinks(links);
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const data = await analytics.getAnalytics();
      await exportAnalyticsToCSV(data);
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('Analytics exported successfully!');
      } else {
        Alert.alert('Success', 'Analytics exported successfully!');
      }
    } catch (error) {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('Failed to export analytics');
      } else {
        Alert.alert('Error', 'Failed to export analytics');
      }
    } finally {
      setExporting(false);
    }
  };

  const handleClearAnalytics = async () => {
    // On web, use native confirm. On mobile, use Alert.alert
    if (typeof window !== 'undefined' && window.confirm) {
      const confirmed = window.confirm(
        'Clear all analytics data? Your tasks and settings will not be affected.\n\nThis cannot be undone.'
      );
      if (confirmed) {
        await analytics.reset();
        window.location.reload(); // Refresh to show updated analytics
      }
    } else {
      Alert.alert(
        'Clear Analytics',
        'Clear all analytics data? Your tasks and settings will not be affected.\n\nThis cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear',
            style: 'destructive',
            onPress: async () => {
              await analytics.reset();
              // Would need to trigger a re-render here
            },
          },
        ]
      );
    }
  };

  const handleSignOut = () => {
    // On web, use native confirm. On mobile, use Alert.alert
    if (typeof window !== 'undefined' && window.confirm) {
      const confirmed = window.confirm('Are you sure you want to sign out?');
      if (confirmed) {
        signOut();
      }
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: signOut,
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        <AnalyticsDashboard />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.card}>
            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={32} color="#e94560" />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user?.displayName || 'User'}</Text>
                <Text style={styles.profileEmail}>{user?.email}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meeting Calculator</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Default Salary</Text>
                <Text style={styles.settingDescription}>
                  Used as default in meeting calculator
                </Text>
              </View>
              <View style={styles.salaryInput}>
                <Text style={styles.dollarSign}>$</Text>
                <TextInput
                  style={styles.input}
                  value={defaultSalary}
                  onChangeText={setDefaultSalary}
                  keyboardType="number-pad"
                  placeholder="75000"
                  placeholderTextColor="#8b8b8b"
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Daily Reminders</Text>
                <Text style={styles.settingDescription}>
                  Get reminded to set your 3 tasks
                </Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#0f3460', true: '#e94560' }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.card}>
            <View style={styles.themeRow}>
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  theme === 'dark' && styles.themeOptionSelected
                ]}
                onPress={() => setTheme('dark')}
              >
                <Ionicons
                  name="moon"
                  size={24}
                  color={theme === 'dark' ? '#e94560' : '#8b8b8b'}
                />
                <Text style={[
                  styles.themeLabel,
                  theme === 'dark' && styles.themeLabelSelected
                ]}>
                  Dark Mode
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.themeOption,
                  theme === 'light' && styles.themeOptionSelected
                ]}
                onPress={() => setTheme('light')}
              >
                <Ionicons
                  name="sunny"
                  size={24}
                  color={theme === 'light' ? '#e94560' : '#8b8b8b'}
                />
                <Text style={[
                  styles.themeLabel,
                  theme === 'light' && styles.themeLabelSelected
                ]}>
                  Light Mode
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Focus Music</Text>
          <View style={styles.card}>
            <MusicLinksManager musicLinks={musicLinks} onUpdate={handleUpdateMusicLinks} />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSaveSettings}
          disabled={saving}
        >
          <Ionicons name="checkmark-circle" size={24} color="#fff" />
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Session History</Text>
            <TouchableOpacity onPress={() => setShowHistory(!showHistory)}>
              <Ionicons
                name={showHistory ? "chevron-up" : "chevron-down"}
                size={20}
                color="#8b8b8b"
              />
            </TouchableOpacity>
          </View>
          {showHistory && <SessionHistoryCalendar />}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <TouchableOpacity
            style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
            onPress={handleExportData}
            disabled={exporting}
          >
            <Ionicons name="download-outline" size={24} color="#2d6a4f" />
            <Text style={styles.exportButtonText}>
              {exporting ? 'Exporting...' : 'Export Analytics to CSV'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Version</Text>
              <Text style={styles.aboutValue}>1.0.0</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Philosophy</Text>
              <Text style={styles.aboutValue}>Do less, achieve more</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.clearAnalyticsButton} onPress={handleClearAnalytics}>
          <Ionicons name="trash-outline" size={24} color="#8b8b8b" />
          <Text style={styles.clearAnalyticsText}>Clear Analytics Data</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={24} color="#e94560" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          FocusGuard - The Anti-Productivity Productivity App
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  salaryInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  dollarSign: {
    color: colors.textSecondary,
    fontSize: 16,
    marginRight: 4,
  },
  input: {
    color: colors.text,
    fontSize: 16,
    padding: 8,
    width: 80,
    textAlign: 'right',
  },
  saveButton: {
    backgroundColor: colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  aboutLabel: {
    fontSize: 16,
    color: colors.text,
  },
  aboutValue: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 8,
  },
  themeOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(233, 69, 96, 0.1)',
  },
  themeLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  themeLabelSelected: {
    color: colors.text,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.success,
    gap: 8,
  },
  exportButtonDisabled: {
    opacity: 0.6,
  },
  exportButtonText: {
    color: colors.success,
    fontSize: 16,
    fontWeight: '600',
  },
  clearAnalyticsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.textSecondary,
    marginBottom: 16,
    gap: 8,
  },
  clearAnalyticsText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: 24,
    gap: 8,
  },
  signOutText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 16,
  },
});
