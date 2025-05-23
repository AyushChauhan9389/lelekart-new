import React, { useState, useEffect } from 'react';
import { Alert, StyleSheet, View, ActivityIndicator } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText'; // Import ThemedText
import { AddressForm } from '@/components/address/AddressForm';
import { NavigationHeader } from '@/components/ui/NavigationHeader';
import { api } from '@/utils/api';
import type { Address } from '@/types/api';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import { LoginPrompt } from '@/components/ui/LoginPrompt'; // Import LoginPrompt

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default function EditAddressScreen() {
  const { user, isLoading: isAuthLoading } = useAuth(); // Get auth state
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [address, setAddress] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState(true); // For address data loading
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Only fetch if logged in and ID is present
    if (!user || !id) {
      setIsLoading(false);
      return;
    }

    const fetchAddress = async () => {
      setIsLoading(true); // Start loading address data
      try {
        const addresses = await api.addresses.getAll();
        console.log('[EditAddressScreen] Fetched addresses:', JSON.stringify(addresses, null, 2)); // Log fetched data
        const foundAddress = addresses.find(addr => addr.id === Number(id));
        console.log('[EditAddressScreen] Found address for editing:', JSON.stringify(foundAddress, null, 2)); // Log the specific address
        if (!foundAddress) {
          Alert.alert('Error', 'Address not found');
          router.back();
          return;
        }
        setAddress(foundAddress);
      } catch (error) {
        console.error('Error fetching address:', error);
        Alert.alert('Error', 'Failed to load address. Please try again.');
        router.back();
      } finally {
        setIsLoading(false); // Stop loading address data
      }
    };

    fetchAddress();
  }, [id, user]); // Add user dependency

  // Align type with AddressForm's onSubmit prop
  const handleSubmit = async (formData: Omit<Address, 'id' | 'userId'>) => {
    // Ensure address and address.id exist before proceeding
    if (!address || typeof address.id !== 'number') {
        console.error("Address or Address ID is missing, cannot update.");
        Alert.alert('Error', 'Cannot update address, ID is missing.');
        return;
    }

    setIsSubmitting(true);
    try {
      // No transformation needed, formData already uses pincode
      // Log the exact payload being sent
      console.log('[EditAddressScreen] Sending update payload:', JSON.stringify(formData, null, 2));

      // Now address.id is guaranteed to be a number
      await api.addresses.update(address.id, formData);
      router.back();
    } catch (error) {
      console.error('Error updating address:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update address. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading indicator for auth or address data
  if (isAuthLoading || (user && isLoading)) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <NavigationHeader title="Edit Address" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ThemedView>
    );
  }

  // Show login prompt if not logged in
  if (!user) {
    return (
       <ThemedView style={styles.container}>
          <Stack.Screen options={{ headerShown: false }} />
          <NavigationHeader title="Edit Address" />
          <LoginPrompt />
        </ThemedView>
    );
  }
  
  // Handle case where address couldn't be loaded after logging in
   if (!address) {
      return (
        <ThemedView style={styles.container}>
          <Stack.Screen options={{ headerShown: false }} />
          <NavigationHeader title="Edit Address" />
           <View style={styles.loadingContainer}>
             <ThemedText>Address not found or failed to load.</ThemedText>
          </View>
        </ThemedView>
      );
    }

  // Render form if logged in and address is loaded
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <NavigationHeader title="Edit Address" />
      <AddressForm
        initialData={address}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </ThemedView>
  );
}
