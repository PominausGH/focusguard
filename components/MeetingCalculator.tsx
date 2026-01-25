import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { analytics } from '../services/analytics';

interface MeetingCalculatorProps {
  defaultSalary: number;
}

export const MeetingCalculator: React.FC<MeetingCalculatorProps> = ({ defaultSalary }) => {
  const [attendees, setAttendees] = useState('3');
  const [salary, setSalary] = useState(defaultSalary.toString());
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartTimeRef = useRef<number>(0);

  // Update salary when defaultSalary prop changes (e.g., from settings)
  useEffect(() => {
    setSalary(defaultSalary.toString());
  }, [defaultSalary]);

  // Cost per second = (attendees * salary) / (2080 hours/year * 60 minutes * 60 seconds)
  const costPerSecond = ((parseInt(attendees) || 0) * (parseInt(salary) || 0)) / (2080 * 3600);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const newSeconds = prev + 1;
          setTotalCost(costPerSecond * newSeconds);
          return newSeconds;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, costPerSecond]);

  const handleStartStop = () => {
    if (isRunning) {
      // Stopping - track the session
      setIsRunning(false);
      if (elapsedSeconds > 0 && totalCost > 0) {
        analytics.trackMeetingSession(totalCost, elapsedSeconds);
      }
    } else {
      if (!attendees || parseInt(attendees) < 1) {
        Alert.alert('Error', 'Please enter at least 1 attendee');
        return;
      }
      if (!salary || parseInt(salary) < 1) {
        Alert.alert('Error', 'Please enter a valid salary');
        return;
      }
      sessionStartTimeRef.current = Date.now();
      setIsRunning(true);
    }
  };

  const handleReset = () => {
    // Track session if there was one
    if (elapsedSeconds > 0 && totalCost > 0) {
      analytics.trackMeetingSession(totalCost, elapsedSeconds);
    }
    setIsRunning(false);
    setElapsedSeconds(0);
    setTotalCost(0);
  };

  const handleShare = async () => {
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    const message = `This ${minutes}:${seconds.toString().padStart(2, '0')} meeting with ${attendees} people just cost $${totalCost.toFixed(2)}! 💸\n\nTracked with FocusGuard - the anti-productivity productivity app.`;

    try {
      // Check if Share API is available (mobile devices)
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await Share.share({ message });
        await analytics.trackMeetingShare();
      } else {
        // Fallback for web - copy to clipboard
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(message);
          // Use browser alert on web
          if (typeof window !== 'undefined' && window.alert) {
            window.alert('✅ Meeting cost copied to clipboard!');
          } else {
            Alert.alert('Copied!', 'Meeting cost copied to clipboard');
          }
          await analytics.trackMeetingShare();
        } else {
          throw new Error('Clipboard not available');
        }
      }
    } catch (error) {
      console.error('Share error:', error);
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('❌ Could not share meeting cost. Please try again.');
      } else {
        Alert.alert('Error', 'Could not share meeting cost');
      }
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCost = (cost: number) => {
    if (cost >= 1000) {
      return `$${(cost / 1000).toFixed(1)}k`;
    }
    return `$${cost.toFixed(2)}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.costDisplay}>
        <Text style={styles.costLabel}>Meeting Cost</Text>
        <Text style={[styles.costAmount, isRunning && styles.costRunning]}>
          {formatCost(totalCost)}
        </Text>
        <Text style={styles.timer}>{formatTime(elapsedSeconds)}</Text>
      </View>

      <View style={styles.inputRow}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Attendees</Text>
          <TextInput
            style={styles.input}
            value={attendees}
            onChangeText={setAttendees}
            keyboardType="number-pad"
            editable={!isRunning}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Avg. Salary ($)</Text>
          <TextInput
            style={styles.input}
            value={salary}
            onChangeText={setSalary}
            keyboardType="number-pad"
            editable={!isRunning}
          />
        </View>
      </View>

      <View style={styles.rateInfo}>
        <Ionicons name="trending-up" size={16} color="#e94560" />
        <Text style={styles.rateText}>
          ${(costPerSecond * 60).toFixed(2)}/min • ${(costPerSecond * 3600).toFixed(0)}/hr
        </Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, isRunning ? styles.stopButton : styles.startButton]}
          onPress={handleStartStop}
        >
          <Ionicons name={isRunning ? 'stop' : 'play'} size={24} color="#fff" />
          <Text style={styles.buttonText}>{isRunning ? 'Stop' : 'Start'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.resetButton]}
          onPress={handleReset}
          disabled={elapsedSeconds === 0}
        >
          <Ionicons name="refresh" size={24} color="#fff" />
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>
      </View>

      {totalCost > 0 && (
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="copy-outline" size={20} color="#e94560" />
          <Text style={styles.shareText}>Copy meeting cost to clipboard</Text>
        </TouchableOpacity>
      )}

      <View style={styles.funFacts}>
        <Text style={styles.funFactTitle}>Did you know?</Text>
        <Text style={styles.funFactText}>
          {parseInt(attendees) >= 5
            ? '📊 Meetings with 5+ people are 33% less productive'
            : parseInt(attendees) >= 3
              ? '⏰ The average meeting runs 25% longer than scheduled'
              : '💡 Two-person meetings are the most efficient'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  costDisplay: {
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 24,
    padding: 32,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  costLabel: {
    fontSize: 16,
    color: '#8b8b8b',
    marginBottom: 8,
  },
  costAmount: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#fff',
  },
  costRunning: {
    color: '#e94560',
  },
  timer: {
    fontSize: 24,
    color: '#8b8b8b',
    marginTop: 8,
    fontFamily: 'monospace',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    color: '#8b8b8b',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#0f3460',
    fontWeight: 'bold',
  },
  rateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 8,
  },
  rateText: {
    color: '#8b8b8b',
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  startButton: {
    backgroundColor: '#2d6a4f',
  },
  stopButton: {
    backgroundColor: '#e94560',
  },
  resetButton: {
    backgroundColor: '#0f3460',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  shareText: {
    color: '#e94560',
    fontSize: 16,
    fontWeight: '600',
  },
  funFacts: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  funFactTitle: {
    fontSize: 14,
    color: '#e94560',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  funFactText: {
    fontSize: 14,
    color: '#8b8b8b',
    lineHeight: 20,
  },
});
