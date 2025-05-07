import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator } from 'react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { Address } from '@/types/api';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface AddressFormProps {
  initialData?: Partial<Address>;
  onSubmit: (data: Omit<Address, 'id' | 'userId'>) => Promise<void>;
  isSubmitting: boolean;
}

export function AddressForm({ initialData, onSubmit, isSubmitting }: AddressFormProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const API_KEY = 'AIzaSyAKmepKDJYoRVq2vc27sOmAUpcjAWcPNFI'; // Store API Key (Note: Insecure for production)

  const [isValidatingPincode, setIsValidatingPincode] = useState(false);
  const [pincodeValidationError, setPincodeValidationError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    addressName: initialData?.addressName || '',
    fullName: initialData?.fullName || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    pincode: initialData?.pincode || '',
    isDefault: initialData?.isDefault || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.addressName) newErrors.addressName = 'Address nickname is required';
    if (!formData.fullName) newErrors.fullName = 'Full name is required';
    if (!formData.phone) {
      newErrors.phone = 'Phone is required';
    } else if (formData.phone.length !== 10) {
      newErrors.phone = 'Phone number must be 10 digits';
    }
    if (!formData.address) newErrors.address = 'Address is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.state) newErrors.state = 'State is required';
    if (!formData.pincode) {
      newErrors.pincode = 'PIN code is required';
    } else if (formData.pincode.length !== 6) {
      newErrors.pincode = 'PIN code must be 6 digits';
    } else if (pincodeValidationError) {
      newErrors.pincode = pincodeValidationError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && !isValidatingPincode;
  };

  const handleSubmit = async () => {
    if (!validate() || isValidatingPincode) {
      console.log("Validation failed or still validating pincode.");
      return;
    }
    await onSubmit(formData);
  };

  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  const fetchAddressDetails = useCallback(async (pincode: string) => {
    if (pincode.length !== 6) {
      setPincodeValidationError(null);
      return;
    }

    setIsValidatingPincode(true);
    setPincodeValidationError(null);

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${pincode},India&key=${API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const addressComponents = data.results[0].address_components;
        const stateComponent = addressComponents.find((comp: any) =>
          comp.types.includes('administrative_area_level_1')
        );

        // Attempt to find the most accurate city name
        let cityName = '';
        const postalTownComponent = addressComponents.find((comp: any) => comp.types.includes('postal_town'));
        const localityComponent = addressComponents.find((comp: any) => comp.types.includes('locality'));
        const adminArea3Component = addressComponents.find((comp: any) => comp.types.includes('administrative_area_level_3'));
        const adminArea2Component = addressComponents.find((comp: any) => comp.types.includes('administrative_area_level_2'));

        if (postalTownComponent) {
          cityName = postalTownComponent.long_name;
        } else if (localityComponent) {
          cityName = localityComponent.long_name;
        } else if (adminArea3Component) {
          // Often, admin_area_level_3 provides a good city name when locality is too broad or a sub-district
          cityName = adminArea3Component.long_name.replace(/ Taluk$/, '').replace(/ Tehsil$/, ''); // Remove common suffixes
        } else if (adminArea2Component) {
          cityName = adminArea2Component.long_name;
        }


        if (stateComponent) {
          const stateName = stateComponent.long_name;
          setFormData(prev => ({
            ...prev,
            state: stateName,
            city: cityName
          }));
          setPincodeValidationError(null);
        } else {
          setPincodeValidationError('Could not determine state from PIN code');
        }
      } else {
        console.warn('Geocoding API error or no results:', data.status, data.error_message);
        setPincodeValidationError('Invalid PIN code');
      }
    } catch (error) {
      console.error('Error validating pincode:', error);
      setPincodeValidationError('Error validating PIN code');
    } finally {
      setIsValidatingPincode(false);
    }
  }, [API_KEY]);

  useEffect(() => {
    const debouncedFetch = debounce(fetchAddressDetails, 800);
    debouncedFetch(formData.pincode);
  }, [formData.pincode, fetchAddressDetails]);

  const handlePincodeChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    setFormData(prev => ({ ...prev, pincode: numericText }));
    setPincodeValidationError(null);
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
          const numericText = text.replace(/[^0-9]/g, '');
          setFormData(prev => ({ ...prev, phone: numericText }));
        }}
        placeholder="1234567890"
        keyboardType="phone-pad"
        maxLength={10}
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
      <View>
        <Input
          label="PIN Code"
          value={formData.pincode}
          onChangeText={handlePincodeChange}
          placeholder="6-digit PIN code"
          keyboardType="number-pad"
          maxLength={6}
          error={pincodeValidationError || errors.pincode}
        />
        {isValidatingPincode && (
          <ActivityIndicator size="small" color={colors.primary} style={styles.pincodeLoader} />
        )}
      </View>
      <Input
        label="City"
        value={formData.city}
        editable={false}
        placeholder="City will be auto-filled based on PIN code"
        error={errors.city}
      />

      <Input
        label="State"
        value={formData.state}
        editable={false}
        placeholder="State will be auto-filled based on PIN code"
        error={errors.state}
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
  pincodeLoader: {
    position: 'absolute',
    right: 12,
    top: 38,
  },
});
