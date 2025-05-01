import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { Address } from '@/types/api';
import Colors from '@/constants/Colors';

interface AddressFormProps {
  initialData?: Partial<Address>;
  onSubmit: (data: Omit<Address, 'id' | 'userId'>) => Promise<void>;
  isSubmitting: boolean;
}

export function AddressForm({ initialData, onSubmit, isSubmitting }: AddressFormProps) {
  const [formData, setFormData] = useState({
    addressName: initialData?.addressName || '',
    fullName: initialData?.fullName || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    pincode: initialData?.pincode || '', // Revert back to pincode
    isDefault: initialData?.isDefault || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.addressName) newErrors.addressName = 'Address nickname is required';
    if (!formData.fullName) newErrors.fullName = 'Full name is required';
    if (!formData.phone) newErrors.phone = 'Phone is required';
    if (!formData.address) newErrors.address = 'Address is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.state) newErrors.state = 'State is required';
    if (!formData.pincode) newErrors.pincode = 'PIN code is required'; // Revert back to pincode

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    await onSubmit(formData);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Input
        label="Address Nickname"
        value={formData.addressName}
        onChangeText={(text) => setFormData(prev => ({ ...prev, addressName: text }))}
        placeholder="e.g., Home, Office"
        error={errors.addressName}
      />

      <Input
        label="Full Name"
        value={formData.fullName}
        onChangeText={(text) => setFormData(prev => ({ ...prev, fullName: text }))}
        placeholder="John Doe"
        error={errors.fullName}
      />

      <Input
        label="Phone"
        value={formData.phone}
        onChangeText={(text) => {
          // Remove non-numeric characters and update state
          const numericText = text.replace(/[^0-9]/g, '');
          setFormData(prev => ({ ...prev, phone: numericText }));
        }}
        placeholder="1234567890"
        keyboardType="phone-pad"
        maxLength={10} // Add maxLength validation
        error={errors.phone}
      />

      <Input
        label="Complete Address"
        value={formData.address}
        onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
        placeholder="House/Flat no., Street, Area, City, State"
        multiline
        numberOfLines={3}
        error={errors.address}
      />

      <Input
        label="City"
        value={formData.city}
        onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
        placeholder="e.g., Mumbai"
        error={errors.city}
      />

      <Input
        label="State"
        value={formData.state}
        onChangeText={(text) => setFormData(prev => ({ ...prev, state: text }))}
        placeholder="e.g., Maharashtra"
        error={errors.state}
      />

      <Input
        label="PIN Code" // Revert label
        value={formData.pincode} // Revert back to pincode
        onChangeText={(text) => setFormData(prev => ({ ...prev, pincode: text }))} // Revert back to pincode
        placeholder="6-digit PIN code"
        keyboardType="number-pad"
        maxLength={6}
        error={errors.pincode} // Revert back to pincode
      />

      <View style={styles.footer}>
        <Button
          onPress={handleSubmit}
          disabled={isSubmitting}
          fullWidth
        >
          {isSubmitting ? 'Saving...' : initialData ? 'Update Address' : 'Add Address'}
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  footer: {
    marginTop: 24,
  },
});
