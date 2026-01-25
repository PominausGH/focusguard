/**
 * Sentry Error Tracking Service
 *
 * Provides centralized error tracking and monitoring for the FocusGuard app.
 * Configure EXPO_PUBLIC_SENTRY_DSN in your .env file to enable.
 */

import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

// Check if Sentry DSN is configured
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
const IS_PRODUCTION = !__DEV__;

/**
 * Initialize Sentry error tracking
 * Should be called once at app startup
 */
export const initSentry = (): void => {
  if (!SENTRY_DSN) {
    if (IS_PRODUCTION) {
      console.warn('Sentry DSN not configured. Error tracking disabled.');
    }
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    debug: __DEV__,
    enabled: IS_PRODUCTION,
    environment: __DEV__ ? 'development' : 'production',
    release: Constants.expoConfig?.version || '1.0.0',

    // Performance Monitoring
    tracesSampleRate: IS_PRODUCTION ? 0.2 : 1.0,

    // Session Tracking
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,

    // Integrations
    integrations: [Sentry.reactNativeTracingIntegration()],

    // Before sending event, filter sensitive data
    beforeSend(event) {
      // Remove any PII from the event
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }
      return event;
    },
  });
};

/**
 * Capture an exception and send to Sentry
 */
export const captureException = (
  error: Error | unknown,
  context?: Record<string, unknown>
): void => {
  if (!SENTRY_DSN) {
    console.error('Error:', error);
    return;
  }

  if (context) {
    Sentry.setContext('additional', context);
  }

  Sentry.captureException(error);
};

/**
 * Capture a message for logging purposes
 */
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info'): void => {
  if (!SENTRY_DSN) {
    console.log(`[${level}] ${message}`);
    return;
  }

  Sentry.captureMessage(message, level);
};

/**
 * Set user context for error tracking
 * Only sets anonymized user ID, no PII
 */
export const setUser = (userId: string): void => {
  if (!SENTRY_DSN) return;

  Sentry.setUser({
    id: userId,
  });
};

/**
 * Clear user context (on logout)
 */
export const clearUser = (): void => {
  if (!SENTRY_DSN) return;

  Sentry.setUser(null);
};

/**
 * Add breadcrumb for debugging
 */
export const addBreadcrumb = (
  category: string,
  message: string,
  data?: Record<string, unknown>
): void => {
  if (!SENTRY_DSN) return;

  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level: 'info',
  });
};

/**
 * Start a performance transaction
 */
export const startTransaction = (name: string, op: string): Sentry.Span | undefined => {
  if (!SENTRY_DSN) return undefined;

  return Sentry.startInactiveSpan({ name, op });
};

export default {
  init: initSentry,
  captureException,
  captureMessage,
  setUser,
  clearUser,
  addBreadcrumb,
  startTransaction,
};
