import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext'; // Keep useAuth to display user info for now

export default function CartScreen() {
  // Auth check is now handled by root layout (_layout.tsx)
  // We can assume 'user' exists here if the component renders
  const { user } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Shopping Cart</ThemedText>
      {/* TODO: Fetch and display cart items for the logged-in user */}
      {user && <ThemedText>Cart for: {user.username}</ThemedText>}
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
