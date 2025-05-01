import React, { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { router, Stack } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { AddressForm } from '@/components/address/AddressForm';
import { NavigationHeader } from '@/components/ui/NavigationHeader';
import { api } from '@/utils/api';
import type { Address } from '@/types/api'; // Import Address type
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import { LoginPrompt } from '@/components/ui/LoginPrompt'; // Import LoginPrompt
import { ActivityIndicator } from 'react-native'; // Import ActivityIndicator

// Removed top-level styles definition

export default function NewAddressScreen() {
  const { user, isLoading } = useAuth(); // Get auth state
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: Omit<Address, 'id' | 'userId'>) => { // Use the Address type from types/api.ts
    setIsSubmitting(true);
    try {
      // Transform data: map zipCode to pincode for the API call
      const apiData = {
        ...formData,
        pincode: formData.zipCode, // Map zipCode to pincode
        zipCode: undefined, // Remove zipCode field if necessary, or let backend ignore it
      };
      // Remove zipCode explicitly if backend complains about extra fields
      delete (apiData as any).zipCode;

      await api.addresses.add(apiData as any); // Use the transformed data (cast to any if needed)
      router.back(); // Go back after successful submission
    } catch (error) {
      console.error('Error adding address:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add address. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading indicator
  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <Stack.Screen options={{ headerShown: false }} />
        <NavigationHeader title="Add New Address" />
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  // Show login prompt if not logged in
  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <NavigationHeader title="Add New Address" />
        <LoginPrompt />
      </ThemedView>
    );
  }

  // Render form if logged in
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <NavigationHeader title="Add New Address" />
      <AddressForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </ThemedView>
  );
}

// Define styles within the component scope
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
