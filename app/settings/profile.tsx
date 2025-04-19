import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { router, Stack } from 'expo-router';
import { NavigationHeader } from '@/components/ui/NavigationHeader';
import { Bell } from 'lucide-react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { api } from '@/utils/api';
import type { UserProfile } from '@/types/api';
import { useAuth } from '@/context/AuthContext';

export default function ProfileSettingsScreen() {
  const [profile, setProfile] = useState<UserProfile>({
    username: '',
    email: '',
    phone: '',
    address: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => createStyles(colors, colorScheme), [colors, colorScheme]);

  useEffect(() => {
    if (user) {
      setProfile({
        username: user.username,
        email: user.email,
        phone: user.phone,
        address: user.address,
      });
    }
  }, [user]);

  const handleSave = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.auth.updateProfile(profile);
      setSuccess('Profile updated successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <NavigationHeader title="Profile Settings" />
      <View style={styles.content}>
        <Input
          label="Username"
          value={profile.username}
          onChangeText={(text) => setProfile(prev => ({ ...prev, username: text }))}
          style={styles.input}
        />

        <Input
          label="Email"
          value={profile.email}
          editable={false}
          style={styles.input}
        />

        <Input
          label="Phone"
          value={profile.phone}
          onChangeText={(text) => setProfile(prev => ({ ...prev, phone: text }))}
          keyboardType="phone-pad"
          style={styles.input}
        />

        <Input
          label="Address"
          value={profile.address}
          onChangeText={(text) => setProfile(prev => ({ ...prev, address: text }))}
          multiline
          numberOfLines={3}
          style={styles.input}
        />

        {error ? (
          <ThemedText style={[styles.message, { color: colors.error }]}>
            {error}
          </ThemedText>
        ) : null}

        {success ? (
          <ThemedText style={[styles.message, { color: colors.success }]}>
            {success}
          </ThemedText>
        ) : null}

        <Button
          onPress={handleSave}
          disabled={isLoading}
          style={styles.saveButton}
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>

        <Button
          variant="ghost"
          onPress={() => router.push('/settings/notifications')}
          style={styles.notificationButton}
          leftIcon={<Bell size={18} color={colors.primary} />}
        >
          Notification Settings
        </Button>
      </View>
    </ThemedView>
  );
}

const createStyles = (colors: typeof Colors.light, colorScheme: 'light' | 'dark' | null) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      padding: 16,
    },
    input: {
      marginBottom: 16,
    },
    message: {
      textAlign: 'center',
      marginBottom: 16,
    },
    saveButton: {
      marginTop: 8,
    },
    notificationButton: {
      marginTop: 16,
    },
  });
