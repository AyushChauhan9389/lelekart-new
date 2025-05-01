import { Tabs } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import React from 'react';
import { Platform, ActivityIndicator } from 'react-native';
import { Home, Compass, ShoppingCart, Heart, User, Package, LayoutGrid } from 'lucide-react-native'; // Add Package and LayoutGrid
import { api } from '@/utils/api';
import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [cartCount, setCartCount] = React.useState(0);

  const fetchCartCount = React.useCallback(async () => {
    try {
      const items = await api.cart.getItems();
      setCartCount(items.length);
    } catch (error) {
      // Only log error if it's not an auth error
      if (error instanceof Error && !error.message.includes('401')) {
        console.error('Failed to fetch cart count:', error);
      }
      setCartCount(0);
    }
  }, []);

  // Initial cart count fetch
  React.useEffect(() => {
    fetchCartCount();
  }, [fetchCartCount]);

  // Update cart count when cart tab is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchCartCount();
    }, [fetchCartCount])
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].primary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      {/* All Tabs are defined directly */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />, // Use Lucide Home
        }}
      />
       <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          headerShown: true, // Explicitly show header for this tab
          tabBarIcon: ({ color, size }) => <Compass size={size} color={color} />, // Use Lucide Compass
        }}
      />
      <Tabs.Screen
        name="menu" // New tab name
        options={{
          title: 'Menu',
          headerShown: true, // Show header
          tabBarIcon: ({ color, size }) => <LayoutGrid size={size} color={color} />, // Use Lucide LayoutGrid
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: cartCount > 0 ? `Cart (${cartCount})` : 'Cart',
          headerShown: true,
          tabBarIcon: ({ color, size }) => <ShoppingCart size={size} color={color} />, // Use Lucide ShoppingCart
          // href removed - protection handled in screen
        }}
      />
       <Tabs.Screen
        name="wishlist"
        options={{
          title: 'Wishlist',
          tabBarIcon: ({ color, size }) => <Heart size={size} color={color} />, // Use Lucide Heart
           // href removed - protection handled in screen
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Account',
          headerShown: true,
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />, // Use Lucide User
          // href removed - protection handled in screen
        }}
      />

      {/* Hidden Search Tab */}
      <Tabs.Screen
        name="search"
        options={{ href: null }}
      />
    </Tabs>
  );
}
