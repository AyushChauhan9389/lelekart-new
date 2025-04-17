import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Mail, KeyRound } from 'lucide-react-native'; // Import Lucide icons
// Removed IconSymbol import
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import { api } from '@/utils/api'; // Import the api object
import type { User } from '@/types/api'; // Import User type

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth(); // Get login function from context

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleRequestOTP = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Use the api utility function
      const response = await api.auth.requestOtp(email);

      // Show success message with expiry time
      setError(`${response.message} (expires in ${Math.floor(response.expiresIn / 60)} minutes)`);
      setOtpSent(true); // Proceed to OTP entry
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      setError('Please enter the OTP');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await api.auth.verifyOtp(email, otp);
      
      if (response.isNewUser) {
        // Navigate to register page with email
        router.push({
          pathname: '/register',
          params: { email: response.email }
        });
      } else {
        await login(response);
        // On successful login, navigate to main app
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>Welcome to LeLeKart</ThemedText>
        <ThemedText type="subtitle" style={styles.subtitle}>
          Login with your email to continue
        </ThemedText>
      </View>

      <View style={styles.form}>
        <Input
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoComplete="email"
          editable={!otpSent}
          leftIcon={<Mail size={20} color={colors.textSecondary} />} // Use Lucide Mail
        />

        {otpSent && (
          <Input
            label="OTP"
            placeholder="Enter OTP sent to your email"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            leftIcon={<KeyRound size={20} color={colors.textSecondary} />} // Use Lucide KeyRound
          />
        )}

        {error ? (
          <ThemedText style={[styles.error, { color: colors.error }]}>{error}</ThemedText>
        ) : null}

        <Button
          onPress={otpSent ? handleVerifyOTP : handleRequestOTP}
          fullWidth
          disabled={isLoading}
        >
          {isLoading ? 'Please wait...' : otpSent ? 'Verify OTP' : 'Send OTP'}
        </Button>

        {!otpSent && (
          <Button
            variant="ghost"
            onPress={() => router.push('/register')}
            fullWidth
            style={styles.registerButton}
          >
            New user? Create Account
          </Button>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.light.background,
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  error: {
    marginBottom: 16,
    textAlign: 'center',
  },
  registerButton: {
    marginTop: 12,
  },
});
