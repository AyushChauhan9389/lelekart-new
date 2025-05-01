import React, { useState, useEffect, useCallback } from 'react'; // Added useEffect, useCallback
import { StyleSheet, View, ScrollView, Text, Modal, TouchableOpacity, FlatList, SafeAreaView, ActivityIndicator } from 'react-native'; // Added ActivityIndicator
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
// Removed Picker import
import type { Address } from '@/types/api';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ChevronDown } from 'lucide-react-native'; // Import icon for dropdown indicator

interface AddressFormProps {
  initialData?: Partial<Address>;
  onSubmit: (data: Omit<Address, 'id' | 'userId'>) => Promise<void>;
  isSubmitting: boolean;
}

// Define states and UTs outside the component
const indianStatesAndUTs = [
  // States
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  // Union Territories
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi (National Capital Territory)", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

export function AddressForm({ initialData, onSubmit, isSubmitting }: AddressFormProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const API_KEY = 'AIzaSyAKmepKDJYoRVq2vc27sOmAUpcjAWcPNFI'; // Store API Key (Note: Insecure for production)

  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [isValidatingPincode, setIsValidatingPincode] = useState(false);
  const [pincodeValidationError, setPincodeValidationError] = useState<string | null>(null);

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
    if (!formData.pincode) {
      newErrors.pincode = 'PIN code is required';
    } else if (formData.pincode.length !== 6) {
      newErrors.pincode = 'PIN code must be 6 digits';
    } else if (pincodeValidationError) { // Check for API validation error
      newErrors.pincode = pincodeValidationError;
    }

    setErrors(newErrors);
    // Form is valid if no errors exist AND pincode is not currently being validated
    return Object.keys(newErrors).length === 0 && !isValidatingPincode;
  };

  const handleSubmit = async () => {
    // Trigger validation one last time before submitting
    await validatePincodeAgainstState(formData.pincode, formData.state);
    // Re-run validate() after potential state update from pincode validation
    if (!validate() || isValidatingPincode) {
        // If still invalid or validating, show alert or rely on error messages
        console.log("Validation failed or still validating pincode.");
        return;
    }
    await onSubmit(formData);
  };

  // Debounce function
  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  // Pincode validation function
  const validatePincodeAgainstState = useCallback(async (pincode: string, state: string) => {
    if (pincode.length !== 6 || !state) {
      setPincodeValidationError(null); // Clear error if inputs are incomplete
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

        if (stateComponent && stateComponent.long_name === state) {
          // Valid: Pincode matches the selected state
          setPincodeValidationError(null);
        } else {
          // Invalid: Pincode does not match the selected state or state not found
          setPincodeValidationError(`PIN code does not belong to ${state}`);
        }
      } else {
        // API error or no results found
        console.warn('Geocoding API error or no results:', data.status, data.error_message);
        setPincodeValidationError('Could not validate PIN code');
      }
    } catch (error) {
      console.error('Error validating pincode:', error);
      setPincodeValidationError('Error validating PIN code');
    } finally {
      setIsValidatingPincode(false);
    }
  }, [API_KEY]); // API_KEY dependency

  // Debounced validation call
  const debouncedValidatePincode = useCallback(debounce(validatePincodeAgainstState, 800), [validatePincodeAgainstState]);

  // Effect to trigger validation when pincode or state changes
  useEffect(() => {
    debouncedValidatePincode(formData.pincode, formData.state);
  }, [formData.pincode, formData.state, debouncedValidatePincode]);


  const handlePincodeChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    setFormData(prev => ({ ...prev, pincode: numericText }));
    // Clear validation error immediately on change, validation will re-run via useEffect
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

      {/* State Custom Dropdown */}
      <Text style={[styles.label, { color: colors.text }]}>State / Union Territory</Text>
      <TouchableOpacity
        style={[styles.dropdownDisplay, { borderColor: errors.state ? colors.error : colors.border, backgroundColor: colors.surface }]}
        onPress={() => setIsPickerVisible(true)}
      >
        <Text style={[styles.dropdownDisplayText, { color: formData.state ? colors.text : colors.textSecondary }]}>
          {formData.state || "Select State / UT..."}
        </Text>
        <ChevronDown size={18} color={colors.textSecondary} />
      </TouchableOpacity>
      {errors.state && <Text style={[styles.errorText, { color: colors.error }]}>{errors.state}</Text>}

      <Modal
        transparent={true}
        visible={isPickerVisible}
        animationType="slide"
        onRequestClose={() => setIsPickerVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <FlatList
              data={indianStatesAndUTs}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, state: item }));
                    setIsPickerVisible(false);
                  }}
                >
                  <Text style={[styles.modalItemText, { color: colors.text }]}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <Button variant="ghost" onPress={() => setIsPickerVisible(false)} style={styles.modalCloseButton}>Close</Button>
          </View>
        </SafeAreaView>
      </Modal>

      <View>
        <Input
          label="PIN Code"
          value={formData.pincode}
          onChangeText={handlePincodeChange} // Use dedicated handler
          placeholder="6-digit PIN code"
          keyboardType="number-pad"
          maxLength={6}
          // Show validation error OR form validation error
          error={pincodeValidationError || errors.pincode}
        />
        {isValidatingPincode && (
          <ActivityIndicator size="small" color={colors.primary} style={styles.pincodeLoader} />
        )}
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
  label: { // Style for Picker label
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  dropdownDisplay: { // Style for the touchable area
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    minHeight: 48,
    marginBottom: 16,
  },
  dropdownDisplayText: {
    fontSize: 16, // Match Input font size
  },
  errorText: { // Style for Picker error text (adjust margin)
    marginTop: -12,
    marginBottom: 16,
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    maxHeight: '60%', // Limit modal height
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingTop: 10,
  },
  modalItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalItemText: {
    fontSize: 16,
  },
  modalCloseButton: {
    marginTop: 10,
    marginBottom: 20, // Add bottom margin for safe area
  },
  footer: {
    marginTop: 24,
  },
  pincodeLoader: { // Style for loader next to pincode input
    position: 'absolute',
    right: 12,
    top: 38, // Adjust based on Input label presence and height
  },
});
