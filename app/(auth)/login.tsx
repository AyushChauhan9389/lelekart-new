import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { api } from '@/utils/api'; // Import the api object

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
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

      // Optional: Display success message from response if needed
      console.log('OTP Request Response:', response); // Log for debugging

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
      // TODO: Implement API call to /api/verify-otp
      const response = await fetch('https://lelehaat.com/api/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      if (!response.ok) {
        throw new Error('Invalid OTP');
      }

      // Navigate to main app after successful login
      router.replace('/(tabs)');
    } catch (err) {
      setError('Invalid OTP. Please try again.');
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
          leftIcon={<IconSymbol name="envelope.fill" size={20} color={colors.textSecondary} />}
        />

        {otpSent && (
          <Input
            label="OTP"
            placeholder="Enter OTP sent to your email"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            leftIcon={<IconSymbol name="key.fill" size={20} color={colors.textSecondary} />}
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
