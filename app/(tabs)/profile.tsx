import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

export default function ProfileScreen() {
  // Auth check is now handled by root layout (_layout.tsx)
  const { user, logout } = useAuth();

  // We can assume user is not null here because of the root layout protection
  if (!user) {
    // This should technically not be reached if root layout protection works
    return null;
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Profile</ThemedText>
      <ThemedText>Welcome, {user.name || user.username}!</ThemedText>
      {/* Add more profile details here */}
      <Button onPress={logout} style={styles.logoutButton}>Logout</Button>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  logoutButton: {
    marginTop: 20,
  },
});
