import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { User as UserIcon, UserRoundCog, Mail, Phone, MapPin } from 'lucide-react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { api } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';

export default function RegisterScreen() {
  const { email: prefillEmail } = useLocalSearchParams<{ email: string }>();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    name: '',
    phone: '',
    address: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    if (prefillEmail) {
      setFormData(prev => ({ ...prev, email: prefillEmail }));
    }
  }, [prefillEmail]);

  const handleRegister = async () => {
    // Basic validation
    if (!formData.email || !formData.username || !formData.name || !formData.phone) {
      setError('Please fill in all required fields');
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (formData.phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await api.auth.register({
        ...formData,
        role: 'buyer',
      });

      // Directly log in the user after successful registration
      await login({
        user: response.user,
        isNewUser: false, // Should be false after registration is complete
        email: response.user.email,
        message: 'Registration successful!', // Use a clear message
      });
      
      router.replace('/(tabs)'); // Redirect to home after login
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof typeof formData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>Create Account</ThemedText>
          <ThemedText type="subtitle" style={styles.subtitle}>
            Join LeLeKart and start shopping
          </ThemedText>
        </View>

        <View style={styles.form}>
          <Input
            label="Username"
            placeholder="Choose a username"
            value={formData.username}
            onChangeText={handleChange('username')}
            autoCapitalize="none"
            leftIcon={<UserIcon size={20} color={colors.textSecondary} />}
          />

          <Input
            label="Full Name"
            placeholder="Enter your full name"
            value={formData.name}
            onChangeText={handleChange('name')}
            leftIcon={<UserRoundCog size={20} color={colors.textSecondary} />}
          />

          <Input
            label="Email"
            placeholder="Enter your email"
            value={formData.email}
            onChangeText={handleChange('email')}
            keyboardType="email-address"
            autoComplete="email"
            autoCapitalize="none"
            editable={!prefillEmail}
            leftIcon={<Mail size={20} color={colors.textSecondary} />}
          />

          <Input
            label="Phone"
            placeholder="Enter your phone number"
            value={formData.phone}
            onChangeText={handleChange('phone')}
            keyboardType="phone-pad"
            leftIcon={<Phone size={20} color={colors.textSecondary} />}
          />

          <Input
            label="Address"
            placeholder="Enter your address (optional)"
            value={formData.address}
            onChangeText={handleChange('address')}
            multiline
            numberOfLines={3}
            leftIcon={<MapPin size={20} color={colors.textSecondary} />}
          />

          {error ? (
            <ThemedText style={[styles.error, { color: colors.error }]}>{error}</ThemedText>
          ) : null}

          <Button
            onPress={handleRegister}
            fullWidth
            disabled={isLoading}
            style={styles.registerButton}
          >
            {isLoading ? 'Please wait...' : 'Create Account'}
          </Button>

          {/* Conditional rendering based on whether email was prefilled */}
          {!prefillEmail && (
            <Button
              variant="ghost"
              onPress={() => router.push('/login')}
              fullWidth
              style={styles.loginButton}
            >
              Already have an account? Login
            </Button>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginTop: 20,
    marginBottom: 32,
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
    marginTop: 8,
  },
  loginButton: {
    marginTop: 12,
  },
});
