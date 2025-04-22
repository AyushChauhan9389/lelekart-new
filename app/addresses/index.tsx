import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, ScrollView, Alert, Pressable, Platform } from 'react-native';
import { router, Stack, useFocusEffect } from 'expo-router';
import { NavigationHeader } from '@/components/ui/NavigationHeader';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { api } from '@/utils/api';
import type { Address } from '@/types/api';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { MapPin, Plus, Edit2, Trash2, Star, StarOff } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import { LoginPrompt } from '@/components/ui/LoginPrompt'; // Import LoginPrompt
import { ActivityIndicator } from 'react-native'; // Import ActivityIndicator

function AddressesContent() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => createStyles(colors, colorScheme), [colors, colorScheme]);

  const fetchAddresses = async () => {
    try {
      const response = await api.addresses.getAll();
      setAddresses(response);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      Alert.alert('Error', 'Failed to load addresses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch addresses when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchAddresses();
    }, [])
  );

  const handleDelete = async (id: number) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.addresses.delete(id);
              setAddresses(prev => prev.filter(addr => addr.id !== id));
            } catch (error) {
              console.error('Error deleting address:', error);
              Alert.alert('Error', 'Failed to delete address. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (id: number) => {
    try {
      await api.addresses.setDefault(id);
      setAddresses(prev =>
        prev.map(addr => ({
          ...addr,
          isDefault: addr.id === id,
        }))
      );
    } catch (error) {
      console.error('Error setting default address:', error);
      Alert.alert('Error', 'Failed to set default address. Please try again.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {addresses.map(address => (
          <View key={address.id} style={styles.addressCard}>
            <View style={styles.addressHeader}>
              <View style={styles.nameContainer}>
                <MapPin size={18} color={colors.primary} />
                <ThemedText style={styles.addressName}>
                  {address.addressName}
                </ThemedText>
              </View>
              <View style={styles.actions}>
                <Pressable
                  onPress={() => handleSetDefault(address.id)}
                  style={({ pressed }) => [
                    styles.actionButton,
                    pressed && styles.actionButtonPressed,
                  ]}
                >
                  {address.isDefault ? (
                    <Star size={18} color={colors.primary} />
                  ) : (
                    <StarOff size={18} color={colors.textSecondary} />
                  )}
                </Pressable>
                <Pressable
                  onPress={() => router.push({
                    pathname: '/addresses/edit',
                    params: { id: address.id }
                  } as any)}
                  style={({ pressed }) => [
                    styles.actionButton,
                    pressed && styles.actionButtonPressed,
                  ]}
                >
                  <Edit2 size={18} color={colors.text} />
                </Pressable>
                <Pressable
                  onPress={() => handleDelete(address.id)}
                  style={({ pressed }) => [
                    styles.actionButton,
                    pressed && styles.actionButtonPressed,
                  ]}
                >
                  <Trash2 size={18} color={colors.error} />
                </Pressable>
              </View>
            </View>
            <View style={styles.addressDetails}>
              <ThemedText style={styles.fullName}>
                {address.fullName}
              </ThemedText>
              <ThemedText style={styles.addressText}>
                {address.address}
              </ThemedText>
              <ThemedText style={styles.addressText}>
                {address.city}, {address.state}
              </ThemedText>
              <ThemedText style={styles.pincode}>
                PIN Code: {address.pincode}
              </ThemedText>
              <ThemedText style={styles.phone}>
                Phone: {address.phone}
              </ThemedText>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          onPress={() => router.push('/addresses/new' as any)}
          leftIcon={<Plus size={18} color={Colors.light.background} />}
          fullWidth
        >
          Add New Address
        </Button>
      </View>
    </ThemedView>
  );
}

export default function AddressesScreen() {
  const { user, isLoading } = useAuth(); // Get auth state
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => createStyles(colors, colorScheme), [colors, colorScheme]);

  // Show loading indicator
  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <Stack.Screen options={{ headerShown: false }} />
        <NavigationHeader title="My Addresses" />
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  // Show login prompt if not logged in
  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <NavigationHeader title="My Addresses" />
        <LoginPrompt />
      </ThemedView>
    );
  }

  // Render content if logged in
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <NavigationHeader title="My Addresses" />
      <AddressesContent />
    </ThemedView>
  );
}

const createStyles = (colors: typeof Colors.light, colorScheme: 'light' | 'dark' | null) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  addressCard: {
    backgroundColor: colors.card, // Use theme card color
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border, // Use theme border color
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.surface, // Use theme surface color
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  addressDetails: {
    marginLeft: 26,
  },
  fullName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    marginBottom: 2,
  },
  pincode: {
    fontSize: 14,
    marginTop: 2,
    color: colors.textSecondary, // Use theme textSecondary color
  },
  phone: {
    fontSize: 14,
    marginTop: 4,
    color: colors.textSecondary, // Use theme textSecondary color
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border, // Use theme border color
    backgroundColor: colors.background, // Use theme background color
  },
  centerContent: { // Style for centering loading indicator
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
