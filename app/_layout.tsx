import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../contexts/AuthContext';
import { TaskProvider } from '../contexts/TaskContext';
import { FocusProvider } from '../contexts/FocusContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { BreakOverlay } from '../components/BreakOverlay';
import { View, StyleSheet } from 'react-native';
import { initSentry } from '../services/sentry';

export default function RootLayout() {
  // Initialize Sentry on app start
  useEffect(() => {
    initSentry();
  }, []);
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <TaskProvider>
            <FocusProvider>
              <View style={styles.container}>
                <StatusBar style="light" />
                <Stack
                  screenOptions={{
                    headerStyle: {
                      backgroundColor: '#1a1a2e',
                    },
                    headerTintColor: '#fff',
                    headerTitleStyle: {
                      fontWeight: 'bold',
                    },
                    contentStyle: {
                      backgroundColor: '#16213e',
                    },
                  }}
                >
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="auth"
                    options={{
                      title: 'Welcome',
                      headerShown: false,
                    }}
                  />
                </Stack>
                <BreakOverlay />
              </View>
            </FocusProvider>
          </TaskProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16213e',
  },
});
