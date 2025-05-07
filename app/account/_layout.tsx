import { Stack } from 'expo-router';
import React from 'react';

export default function AccountLayout() {
  return (
    <Stack>
      <Stack.Screen name="wishlist" options={{ title: 'My Wishlist', headerShown: true }} />
      {/* Add other account-related screens here if needed */}
    </Stack>
  );
}
