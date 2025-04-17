import React, { useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { AddressForm } from '@/components/address/AddressForm';
import { api } from '@/utils/api';

export default function NewAddressScreen() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: Parameters<typeof api.addresses.add>[0]) => {
    setIsSubmitting(true);
    try {
      await api.addresses.add(formData);
      router.back();
    } catch (error) {
      console.error('Error adding address:', error);
      Alert.alert('Error', 'Failed to add address. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <AddressForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </ThemedView>
  );
}
