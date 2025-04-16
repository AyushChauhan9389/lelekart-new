import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, ActivityIndicator } from 'react-native';
import { Home, Compass, ShoppingCart, Heart, User } from 'lucide-react-native'; // Import Lucide icons

import { HapticTab } from '@/components/HapticTab';
// Removed IconSymbol import
import TabBarBackground from '@/components/ui/TabBarBackground';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  // No need for isLoading or user check here anymore

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
        name="cart"
        options={{
          title: 'Cart',
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
          title: 'Profile',
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
