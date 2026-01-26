import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FocusSession, FocusPresetType, FocusState, FOCUS_PRESETS } from '../types';
import { analytics } from '../services/analytics';

interface FocusContextType {
  session: FocusSession | null;
  timeRemaining: number; // milliseconds
  isActive: boolean;
  startSession: (preset: FocusPresetType, taskId?: string) => void;
  completeWorkPeriod: () => void;
  skipBreak: () => void;
  endSession: () => void;
}

const FocusContext = createContext<FocusContextType | undefined>(undefined);

const FOCUS_SESSION_KEY = '@focusshield_focus_session';

export const FocusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<FocusSession | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isActive, setIsActive] = useState(false);

  // Load session from storage on mount
  useEffect(() => {
    loadSession();
  }, []);

  // Timer tick - update every second
  useEffect(() => {
    if (!session) {
      setTimeRemaining(0);
      setIsActive(false);
      return;
    }

    setIsActive(true);

    const updateTimer = () => {
      const elapsed = Date.now() - session.startTime;
      const remaining = session.duration - elapsed;

      if (remaining <= 0) {
        // Time's up! Auto-transition
        if (session.state === 'working') {
          // Work period complete
          handleWorkPeriodComplete();
        } else {
          // Break complete, start next work period
          handleBreakComplete();
        }
        setTimeRemaining(0);
      } else {
        setTimeRemaining(remaining);
      }
    };

    updateTimer(); // Initial update
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [session]);

  const loadSession = async () => {
    try {
      const stored = await AsyncStorage.getItem(FOCUS_SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as FocusSession;
        setSession(parsed);
      }
    } catch (error) {
      console.error('Error loading focus session:', error);
    }
  };

  const saveSession = async (sessionData: FocusSession | null) => {
    try {
      if (sessionData) {
        await AsyncStorage.setItem(FOCUS_SESSION_KEY, JSON.stringify(sessionData));
      } else {
        await AsyncStorage.removeItem(FOCUS_SESSION_KEY);
      }
    } catch (error) {
      console.error('Error saving focus session:', error);
    }
  };

  const startSession = (preset: FocusPresetType, taskId?: string) => {
    const presetConfig = FOCUS_PRESETS[preset];
    const newSession: FocusSession = {
      id: 'focus_' + Date.now(),
      startTime: Date.now(),
      duration: presetConfig.workDuration,
      mode: preset,
      linkedTaskId: taskId,
      state: 'working',
      pomodorosCompleted: 0,
      currentSessionInCycle: 1,
    };

    setSession(newSession);
    saveSession(newSession);
  };

  const handleWorkPeriodComplete = async () => {
    if (!session) return;

    const preset = FOCUS_PRESETS[session.mode];
    const newPomodoroCount = session.pomodorosCompleted + 1;

    // Track analytics
    await analytics.trackPomodoro(
      session.mode,
      preset.workDuration / 60000, // convert to minutes
      session.linkedTaskId
    );

    // Determine break type
    const isLongBreak = newPomodoroCount % preset.longBreakAfter === 0;
    const breakDuration = isLongBreak ? preset.longBreakDuration : preset.shortBreakDuration;
    const breakState: FocusState = isLongBreak ? 'longBreak' : 'shortBreak';

    const updatedSession: FocusSession = {
      ...session,
      startTime: Date.now(),
      duration: breakDuration,
      state: breakState,
      pomodorosCompleted: newPomodoroCount,
      breakStartTime: Date.now(),
    };

    setSession(updatedSession);
    saveSession(updatedSession);
  };

  const handleBreakComplete = () => {
    if (!session) return;

    const preset = FOCUS_PRESETS[session.mode];
    // Increment session cycle or reset after long break
    const nextSessionInCycle =
      session.state === 'longBreak'
        ? 1
        : (session.currentSessionInCycle % preset.longBreakAfter) + 1;

    const updatedSession: FocusSession = {
      ...session,
      startTime: Date.now(),
      duration: preset.workDuration,
      state: 'working',
      breakStartTime: undefined,
      currentSessionInCycle: nextSessionInCycle,
    };

    setSession(updatedSession);
    saveSession(updatedSession);
  };

  const completeWorkPeriod = () => {
    // Manual completion (if user wants to end early)
    handleWorkPeriodComplete();
  };

  const skipBreak = () => {
    if (!session || session.state === 'working') return;

    // Skip break and start next work period
    handleBreakComplete();
  };

  const endSession = async () => {
    // End the entire session
    if (session && session.pomodorosCompleted > 0) {
      // Track final session if any pomodoros were completed
      await analytics.trackPomodoro(
        session.mode,
        0, // partial session
        session.linkedTaskId
      );
    }

    setSession(null);
    await saveSession(null);
  };

  return (
    <FocusContext.Provider
      value={{
        session,
        timeRemaining,
        isActive,
        startSession,
        completeWorkPeriod,
        skipBreak,
        endSession,
      }}
    >
      {children}
    </FocusContext.Provider>
  );
};

export const useFocus = (): FocusContextType => {
  const context = useContext(FocusContext);
  if (context === undefined) {
    throw new Error('useFocus must be used within a FocusProvider');
  }
  return context;
};
