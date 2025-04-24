import React, { useState, useEffect, useMemo } from 'react'; // Import useState, useEffect
import { StyleSheet, View, Pressable, Dimensions, ActivityIndicator } from 'react-native'; // Import ActivityIndicator
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, MapPin, LogIn } from 'lucide-react-native'; // Import MapPin, LogIn
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button'; // Import Button
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import { api } from '@/utils/api';
import type { Address } from '@/types/api'; // Import Address type

const { width: WINDOW_WIDTH } = Dimensions.get('window');

export function HomeHeader() {
  const { user } = useAuth(); // Get user state
  const [defaultAddress, setDefaultAddress] = useState<Address | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    const fetchAddress = async () => {
      if (user) {
        setLoadingAddress(true);
        try {
          const addresses = await api.addresses.getAll();
          const defaultAddr = addresses.find(addr => addr.isDefault) || addresses[0];
          setDefaultAddress(defaultAddr || null);
        } catch (error) {
          console.error("Failed to fetch addresses:", error);
          setDefaultAddress(null); // Reset on error
        } finally {
          setLoadingAddress(false);
        }
      } else {
        setDefaultAddress(null); // Clear address if user logs out
      }
    };

    fetchAddress();
  }, [user]);

  return (
    // Keep SafeAreaView for top edge only, remove background
    <SafeAreaView edges={['top']}>
      {/* Add an outer View to hold the background color */}
      <View style={[styles.outerContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.container, { borderBottomColor: colors.border }]}>
          {/* Left Section remains the same */}
        <View style={styles.leftContainer}>
          {user ? (
            loadingAddress ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Pressable style={styles.locationButton} onPress={() => router.push('/addresses')}>
                <ThemedText numberOfLines={1} style={styles.locationLabel}>
                  Deliver to
                </ThemedText>
                <View style={styles.locationRow}>
                  <MapPin size={16} color={colors.text} style={{ marginRight: 4 }}/>
                  {/* Updated text to show State and Pincode */}
                  <ThemedText numberOfLines={1} style={styles.location}>
                    {defaultAddress ? `${defaultAddress.state || 'State'}, ${defaultAddress.pincode || 'Pincode'}` : 'Select Address'}
                  </ThemedText>
                </View>
              </Pressable>
            )
          ) : (
            <Button
              variant="outline"
              size="sm"
              onPress={() => router.push('/(auth)/login')}
              style={styles.loginButton}
              leftIcon={<LogIn size={16} color={colors.primary}/>}
            >
              Login
            </Button>
          )}
        </View>

        {/* Center Section (Logo) */}
        <View style={styles.centerContainer}>
          <ThemedText style={styles.logoText}>LeleKart</ThemedText>
        </View>

        {/* Right Section (Icons) */}
        <View style={styles.rightContainer}>
          {/* Single notification icon */}
          <Pressable
            onPress={() => router.push('/settings/notifications')}
            style={styles.iconButton}
          >
            <Bell size={24} color={colors.text} />
          </Pressable>
        </View>
      </View>

      {/* Search Bar (Now a button that navigates to search screen) */}
      <Pressable
        style={[styles.searchButton, { backgroundColor: colors.surface }]}
        onPress={() => router.push('/(tabs)/search')}
      >
        <ThemedText style={styles.searchText}>Search products...</ThemedText>
      </Pressable>
      </View> 
    </SafeAreaView> 
  );
}

// Moved StyleSheet creation into a function that accepts colors
const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  outerContainer: { // Style for the new outer View
    // Background color applied inline
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: WINDOW_WIDTH >= 768 ? 24 : 16,
    paddingVertical: WINDOW_WIDTH >= 768 ? 12 : 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  leftContainer: {
    flex: 2, // Increased flex to give more space
    alignItems: 'flex-start',
    marginRight: 8,
  },
  centerContainer: {
    flex: 3, // Give more space to center
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  rightContainer: {
    flex: 2, // Match left container flex
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationButton: {
    paddingRight: 8,
  },
  locationLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    paddingHorizontal: 12,
  },
  logoText: {
    fontSize: WINDOW_WIDTH >= 768 ? 26 : 22,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  iconContainer: { // Renamed to rightContainer styles
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
  },
  searchButton: {
    margin: 12,
    padding: 12,
    borderRadius: 8,
    alignItems: 'flex-start',
  },
  searchText: {
    fontSize: 14,
    opacity: 0.7,
  },
});
