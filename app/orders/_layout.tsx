import React from 'react';
import { Stack } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function OrdersLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Stack
      initialRouteName="index"
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.primary,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'My Orders',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Order Details',
        }}
      />
    </Stack>
  );
}
