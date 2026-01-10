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
import { AnalyticsDashboard } from '../../components/AnalyticsDashboard';
import { analytics } from '../../services/analytics';

export default function SettingsScreen() {
  const { user, signOut, updateSettings } = useAuth();
  const [defaultSalary, setDefaultSalary] = useState(
    (user?.settings?.defaultSalary || 75000).toString()
  );
  const [notifications, setNotifications] = useState(
    user?.settings?.notifications ?? true
  );
  const [saving, setSaving] = useState(false);

  const handleSaveSettings = async () => {
    if (!user) return;

    setSaving(true);
    try {
      updateSettings({
        defaultSalary: parseInt(defaultSalary) || 75000,
        notifications,
      });
      Alert.alert('Success', 'Settings saved!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setSaving(false);
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16213e',
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
    color: '#fff',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b8b8b',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0f3460',
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
    color: '#fff',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#8b8b8b',
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
    color: '#fff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#8b8b8b',
  },
  salaryInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f3460',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  dollarSign: {
    color: '#8b8b8b',
    fontSize: 16,
    marginRight: 4,
  },
  input: {
    color: '#fff',
    fontSize: 16,
    padding: 8,
    width: 80,
    textAlign: 'right',
  },
  saveButton: {
    backgroundColor: '#2d6a4f',
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
    color: '#fff',
  },
  aboutValue: {
    fontSize: 14,
    color: '#8b8b8b',
  },
  divider: {
    height: 1,
    backgroundColor: '#0f3460',
    marginVertical: 8,
  },
  clearAnalyticsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#8b8b8b',
    marginBottom: 16,
    gap: 8,
  },
  clearAnalyticsText: {
    color: '#8b8b8b',
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
    borderColor: '#e94560',
    marginBottom: 24,
    gap: 8,
  },
  signOutText: {
    color: '#e94560',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    color: '#8b8b8b',
    fontSize: 12,
    marginTop: 16,
  },
});
