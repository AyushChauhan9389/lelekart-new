import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { AddressForm } from '@/components/address/AddressForm';
import { api } from '@/utils/api';
import type { Address } from '@/types/api';

export default function EditAddressScreen() {
  return (
    <>
      <Stack.Screen options={{ 
        title: 'Edit Address',
        headerBackTitle: 'Back'
      }} />
      <EditAddressContent />
    </>
  );
}

function EditAddressContent() {
  const { id } = useLocalSearchParams();
  const [address, setAddress] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        // We'll get this from the addresses list since there's no single address endpoint
        const addresses = await api.addresses.getAll();
        const foundAddress = addresses.find(addr => addr.id === Number(id));
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
        setIsLoading(false);
      }
    };

    fetchAddress();
  }, [id]);

  const handleSubmit = async (formData: Parameters<typeof api.addresses.update>[1]) => {
    if (!address) return;

    setIsSubmitting(true);
    try {
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

  if (isLoading || !address) {
    return null;
  }

  return (
    <ThemedView style={{ flex: 1, backgroundColor: 'white' }}>
      <AddressForm
        initialData={address}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </ThemedView>
  );
}
