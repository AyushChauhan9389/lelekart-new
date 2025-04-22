import React from 'react';
import { StyleSheet, View, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell } from 'lucide-react-native';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemedText } from '@/components/ThemedText';
import { api } from '@/utils/api';

const { width: WINDOW_WIDTH } = Dimensions.get('window');

export function HomeHeader() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = React.useMemo(() => createStyles(colors), [colors]); // Use useMemo and createStyles
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
      <View style={[styles.container, { borderBottomColor: colors.border }]}>
        {/* Left Section (Location) */}
        <View style={styles.leftContainer}>
          <Pressable style={styles.locationButton} onPress={() => router.push('/addresses')}>
            <ThemedText numberOfLines={1} style={styles.locationLabel}>
              Deliver to
            </ThemedText>
            <View style={styles.locationRow}>
              <ThemedText numberOfLines={1} style={styles.location}>
                Mumbai, 400001
              </ThemedText>
            </View>
          </Pressable>
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
    </SafeAreaView>
  );
}

// Moved StyleSheet creation into a function that accepts colors
const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
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
