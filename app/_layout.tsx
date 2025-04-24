import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router'; // Removed useRouter, useSegments as they are unused here
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message'; // Import BaseToast, ErrorToast
import { useColorScheme } from '@/hooks/useColorScheme';
import { View, Text, StyleSheet } from 'react-native'; // Import View, Text, StyleSheet
import Colors from '@/constants/Colors';
import { AuthProvider } from '@/context/AuthContext'; // Removed useAuth import

// Removed useProtectedRoute hook as logic will move to individual screens
// function useProtectedRoute() { ... }

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// --- Custom Toast Configuration ---
const toastConfig = {
  /*
    Overwrite 'success' type, by modifying the existing `BaseToast` component
  */
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: Colors.light.primary, backgroundColor: Colors.light.background, width: '90%' }} // Example: primary color border
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.text, // Use app's text color
      }}
      text2Style={{
        fontSize: 14,
        color: Colors.light.textSecondary, // Use app's secondary text color
      }}
    />
  ),
  /*
    Overwrite 'error' type, by modifying the existing `ErrorToast` component
  */
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: Colors.light.error, backgroundColor: Colors.light.background, width: '90%' }} // Example: error color border
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.text,
      }}
      text2Style={{
        fontSize: 14,
        color: Colors.light.textSecondary,
      }}
    />
  ),
  /*
    Or create a completely new type - we don't need this for now
  */
};
// --- End Custom Toast Configuration ---


// Main RootLayoutNav component
function RootLayoutNav() {
  const colorScheme = useColorScheme();
  // Removed useProtectedRoute() call

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="settings/profile" />
        <Stack.Screen name="settings/notifications" />
         <Stack.Screen
           name="product/[id]"
           options={{
             headerShown: false, // Hide the default header
             headerTitle: '',
             // headerTransparent: true, // No longer needed if header is hidden
            headerTintColor: Colors[colorScheme ?? 'light'].primary,
          }}
        />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null; // Or a loading indicator
  }

  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <RootLayoutNav />
        {/* Apply the custom config to the Toast component */}
        <Toast config={toastConfig} /> 
      </GestureHandlerRootView>
    </AuthProvider>
  );
}
