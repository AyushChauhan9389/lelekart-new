import React from 'react';
import { StyleSheet, View, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, ShoppingCart } from 'lucide-react-native';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemedText } from '@/components/ThemedText';
import { api } from '@/utils/api';

const { width: WINDOW_WIDTH } = Dimensions.get('window');

export function HomeHeader() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [cartCount, setCartCount] = React.useState(0);

  // Fetch cart count
  React.useEffect(() => {
    const fetchCartCount = async () => {
      try {
        const items = await api.cart.getItems();
        setCartCount(items.length);
      } catch (error) {
        if (error instanceof Error && !error.message.includes('401')) {
          console.error('Failed to fetch cart count:', error);
        }
      }
    };
    fetchCartCount();
  }, []);

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
      <View style={[styles.container, { borderBottomColor: colors.border }]}>
        {/* Left Section (Location) */}
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

        {/* Right Section (Icons) */}
        <View style={styles.iconContainer}>
          <Pressable
            onPress={() => router.push('/settings/notifications')}
            style={styles.iconButton}
          >
            <Bell size={24} color={colors.text} />
          </Pressable>
          
          <Pressable
            onPress={() => router.push('/(tabs)/cart')}
            style={styles.iconButton}
          >
            <ShoppingCart size={24} color={colors.text} />
            {cartCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <ThemedText style={styles.badgeText}>
                  {cartCount}
                </ThemedText>
              </View>
            )}
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  locationButton: {
    flex: 1,
    marginRight: 16,
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
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
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
