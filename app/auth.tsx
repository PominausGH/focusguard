import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getPasswordStrength } from '../services/validation';

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp } = useAuth();

  // Calculate password strength for sign up
  const passwordStrength = isSignUp && password.length > 0
    ? getPasswordStrength(password)
    : null;

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password, displayName);
      } else {
        await signIn(email, password);
      }
      router.replace('/(tabs)');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      // Use browser alert on web
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Ionicons name="shield-checkmark" size={80} color="#e94560" />
          <Text style={styles.title}>FocusGuard</Text>
          <Text style={styles.subtitle}>Do less. Achieve more.</Text>
        </View>

        <View style={styles.formContainer}>
          {isSignUp && (
            <TextInput
              style={styles.input}
              placeholder="Your Name"
              placeholderTextColor="#8b8b8b"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#8b8b8b"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor="#8b8b8b"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#8b8b8b"
              />
            </TouchableOpacity>
          </View>

          {isSignUp && password.length > 0 && passwordStrength && (
            <View style={styles.passwordStrengthContainer}>
              <View style={styles.strengthBar}>
                <View
                  style={[
                    styles.strengthFill,
                    passwordStrength.strength === 'weak' && styles.strengthWeak,
                    passwordStrength.strength === 'medium' && styles.strengthMedium,
                    passwordStrength.strength === 'strong' && styles.strengthStrong,
                    { width: `${(passwordStrength.score / 5) * 100}%` }
                  ]}
                />
              </View>
              <Text style={[
                styles.strengthText,
                passwordStrength.strength === 'weak' && styles.strengthTextWeak,
                passwordStrength.strength === 'medium' && styles.strengthTextMedium,
                passwordStrength.strength === 'strong' && styles.strengthTextStrong,
              ]}>
                {passwordStrength.strength === 'weak' && 'Weak password'}
                {passwordStrength.strength === 'medium' && 'Medium strength'}
                {passwordStrength.strength === 'strong' && 'Strong password'}
              </Text>
            </View>
          )}

          {isSignUp && (
            <View style={styles.requirementsBox}>
              <Text style={styles.requirementsTitle}>Password must have:</Text>
              <Text style={styles.requirementItem}>• At least 8 characters</Text>
              <Text style={styles.requirementItem}>• At least one letter</Text>
              <Text style={styles.requirementItem}>• At least one number</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {isSignUp ? 'Create Account' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsSignUp(!isSignUp)}
          >
            <Text style={styles.switchText}>
              {isSignUp
                ? 'Already have an account? Sign In'
                : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.featureList}>
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={20} color="#e94560" />
            <Text style={styles.featureText}>Only 3 tasks per day</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="timer" size={20} color="#e94560" />
            <Text style={styles.featureText}>Meeting cost calculator</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="flash" size={20} color="#e94560" />
            <Text style={styles.featureText}>Focus on what matters</Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16213e',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#8b8b8b',
    marginTop: 8,
  },
  formContainer: {
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  passwordInput: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    paddingRight: 50,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  passwordStrengthContainer: {
    marginBottom: 12,
  },
  strengthBar: {
    height: 4,
    backgroundColor: '#1a1a2e',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthWeak: {
    backgroundColor: '#e94560',
  },
  strengthMedium: {
    backgroundColor: '#f39c12',
  },
  strengthStrong: {
    backgroundColor: '#2d6a4f',
  },
  strengthText: {
    fontSize: 12,
    textAlign: 'right',
  },
  strengthTextWeak: {
    color: '#e94560',
  },
  strengthTextMedium: {
    color: '#f39c12',
  },
  strengthTextStrong: {
    color: '#2d6a4f',
  },
  requirementsBox: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  requirementsTitle: {
    color: '#8b8b8b',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  requirementItem: {
    color: '#8b8b8b',
    fontSize: 11,
    marginBottom: 2,
  },
  button: {
    backgroundColor: '#e94560',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchText: {
    color: '#e94560',
    fontSize: 14,
  },
  featureList: {
    marginTop: 24,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    color: '#8b8b8b',
    marginLeft: 12,
    fontSize: 14,
  },
});
