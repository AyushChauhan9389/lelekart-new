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
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    addressLine1: initialData?.addressLine1 || '',
    addressLine2: initialData?.addressLine2 || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    postalCode: initialData?.postalCode || '',
    country: initialData?.country || 'India',
    isDefault: initialData?.isDefault || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.phone) newErrors.phone = 'Phone is required';
    if (!formData.addressLine1) newErrors.addressLine1 = 'Address is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.state) newErrors.state = 'State is required';
    if (!formData.postalCode) newErrors.postalCode = 'Postal code is required';

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
        label="Name"
        value={formData.name}
        onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
        placeholder="John Doe"
        error={errors.name}
      />

      <Input
        label="Phone"
        value={formData.phone}
        onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
        placeholder="1234567890"
        keyboardType="phone-pad"
        error={errors.phone}
      />

      <Input
        label="Address Line 1"
        value={formData.addressLine1}
        onChangeText={(text) => setFormData(prev => ({ ...prev, addressLine1: text }))}
        placeholder="Street address"
        error={errors.addressLine1}
      />

      <Input
        label="Address Line 2 (Optional)"
        value={formData.addressLine2}
        onChangeText={(text) => setFormData(prev => ({ ...prev, addressLine2: text }))}
        placeholder="Apartment, suite, etc."
      />

      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Input
            label="City"
            value={formData.city}
            onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
            placeholder="City"
            error={errors.city}
          />
        </View>

        <View style={styles.halfInput}>
          <Input
            label="State"
            value={formData.state}
            onChangeText={(text) => setFormData(prev => ({ ...prev, state: text }))}
            placeholder="State"
            error={errors.state}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Input
            label="Postal Code"
            value={formData.postalCode}
            onChangeText={(text) => setFormData(prev => ({ ...prev, postalCode: text }))}
            placeholder="Postal code"
            keyboardType="number-pad"
            error={errors.postalCode}
          />
        </View>

        <View style={styles.halfInput}>
          <Input
            label="Country"
            value={formData.country}
            onChangeText={(text) => setFormData(prev => ({ ...prev, country: text }))}
            placeholder="Country"
            editable={false}
          />
        </View>
      </View>

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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  footer: {
    marginTop: 24,
  },
});
