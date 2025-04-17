import React, { useState } from 'react';
import { Alert } from 'react-native';
import { router, Stack } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { AddressForm } from '@/components/address/AddressForm';
import { api } from '@/utils/api';

export default function NewAddressScreen() {
  return (
    <>
      <Stack.Screen options={{ 
        title: 'Add New Address',
        headerBackTitle: 'Back'
      }} />
      <NewAddressContent />
    </>
  );
}

function NewAddressContent() {
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
    <ThemedView style={{ flex: 1, backgroundColor: 'white' }}>
      <AddressForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </ThemedView>
  );
}
