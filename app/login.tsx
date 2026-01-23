import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth, useAlert } from '@/template';
import { theme } from '@/constants/theme';

export default function LoginScreen() {
  const { sendOTP, verifyOTPAndLogin, signInWithPassword, operationLoading } = useAuth();
  const { showAlert } = useAlert();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSendOtp = async () => {
    if (!validateEmail(email)) {
      showAlert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      showAlert('Password Too Short', 'Password must be at least 6 characters');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      showAlert('Passwords Do Not Match', 'Please make sure passwords match');
      return;
    }

    const { error } = await sendOTP(email);
    if (error) {
      showAlert('Error', error);
    } else {
      setShowOtpInput(true);
      showAlert('Success', 'Verification code sent to your email');
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 4) {
      showAlert('Invalid OTP', 'Please enter the 4-digit code');
      return;
    }

    const { error } = await verifyOTPAndLogin(email, otp, { password });
    if (error) {
      showAlert('Verification Failed', error);
    }
  };

  const handlePasswordLogin = async () => {
    if (!validateEmail(email)) {
      showAlert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (!password) {
      showAlert('Password Required', 'Please enter your password');
      return;
    }

    const { error } = await signInWithPassword(email, password);
    if (error) {
      showAlert('Login Failed', error);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setShowOtpInput(false);
    setOtp('');
  };

  return (
    <LinearGradient
      colors={[theme.colors.backgroundGradientStart, theme.colors.backgroundGradientEnd]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <MaterialIcons name="chat-bubble" size={60} color={theme.colors.primary} />
              <Text style={styles.title}>AI Companion</Text>
              <Text style={styles.subtitle}>Your virtual friend awaits</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your@email.com"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!operationLoading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Min. 6 characters"
                  placeholderTextColor={theme.colors.textMuted}
                  secureTextEntry
                  editable={!operationLoading}
                />
              </View>

              {isSignUp && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Re-enter password"
                    placeholderTextColor={theme.colors.textMuted}
                    secureTextEntry
                    editable={!operationLoading}
                  />
                </View>
              )}

              {showOtpInput && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Verification Code</Text>
                  <TextInput
                    style={styles.input}
                    value={otp}
                    onChangeText={setOtp}
                    placeholder="4-digit code"
                    placeholderTextColor={theme.colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={4}
                    editable={!operationLoading}
                  />
                </View>
              )}

              {isSignUp ? (
                showOtpInput ? (
                  <Pressable
                    onPress={handleVerifyOtp}
                    disabled={operationLoading}
                    style={({ pressed }) => [
                      styles.button,
                      operationLoading && styles.buttonDisabled,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <Text style={styles.buttonText}>
                      {operationLoading ? 'Verifying...' : 'Verify & Sign Up'}
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={handleSendOtp}
                    disabled={operationLoading}
                    style={({ pressed }) => [
                      styles.button,
                      operationLoading && styles.buttonDisabled,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <Text style={styles.buttonText}>
                      {operationLoading ? 'Sending...' : 'Send Verification Code'}
                    </Text>
                  </Pressable>
                )
              ) : (
                <Pressable
                  onPress={handlePasswordLogin}
                  disabled={operationLoading}
                  style={({ pressed }) => [
                    styles.button,
                    operationLoading && styles.buttonDisabled,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.buttonText}>
                    {operationLoading ? 'Logging in...' : 'Login'}
                  </Text>
                </Pressable>
              )}

              <Pressable onPress={toggleMode} disabled={operationLoading} style={styles.toggleButton}>
                <Text style={styles.toggleText}>
                  {isSignUp ? 'Already have an account? Login' : 'New user? Sign Up'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  title: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fonts.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  form: {
    gap: theme.spacing.lg,
  },
  inputGroup: {
    gap: theme.spacing.xs,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
    marginLeft: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fonts.bold,
    color: theme.colors.text,
  },
  toggleButton: {
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  toggleText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primaryLight,
    fontWeight: theme.fonts.medium,
  },
});
