import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext'; // Keep useAuth to display user info for now

export default function WishlistScreen() {
  // Auth check is now handled by root layout (_layout.tsx)
  const { user } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">My Wishlist</ThemedText>
      {/* TODO: Fetch and display wishlist items for the logged-in user */}
      {user && <ThemedText>Wishlist for: {user.username}</ThemedText>}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
