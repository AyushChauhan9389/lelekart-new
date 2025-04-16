import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

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
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} /> }} />
      {/* Add Explore screen entry with header shown */}
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore', // Correct tab title
          headerShown: true, // Keep header shown
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="magnifyingglass" color={color} />, // Change icon
        }}
      />
      {/* Keep other tabs - Assuming categories, cart, wishlist, profile are separate files/routes */}
      {/* If categories, cart, etc. are meant to be part of the explore flow, adjust accordingly */}
      {/* <Tabs.Screen name="categories" options={{ title: 'Categories', tabBarIcon: ({ color }) => <IconSymbol size={28} name="square.grid.2x2.fill" color={color} /> }} /> */}
      {/* <Tabs.Screen name="cart" options={{ title: 'Cart', tabBarIcon: ({ color }) => <IconSymbol size={28} name="cart.fill" color={color} /> }} /> */}
      {/* <Tabs.Screen name="wishlist" options={{ title: 'Wishlist', tabBarIcon: ({ color }) => <IconSymbol size={28} name="heart.fill" color={color} /> }} /> */}
      {/* <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} /> }} /> */}
      <Tabs.Screen name="search" options={{ href: null }} />
    </Tabs>
  );
}
