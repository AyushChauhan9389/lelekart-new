import React, { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { router, Stack } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { AddressForm } from '@/components/address/AddressForm';
import { NavigationHeader } from '@/components/ui/NavigationHeader';
import { api } from '@/utils/api';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
});

export default function NewAddressScreen() {
  return <NewAddressContent />;
}

function NewAddressContent() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: Parameters<typeof api.addresses.add>[0]) => {
    setIsSubmitting(true);
    try {
      await api.addresses.add(formData);
      router.back();
    } catch (error) {
      console.error('Error adding address:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add address. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

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
