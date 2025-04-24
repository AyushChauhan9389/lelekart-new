import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router'; // Import useRouter, useSegments
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message'; // Import Toast
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';
import { AuthProvider } from '@/context/AuthContext'; // Removed useAuth import

// Removed useProtectedRoute hook as logic will move to individual screens
// function useProtectedRoute() { ... }

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

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
        <Toast /> {/* Add Toast provider here */}
      </GestureHandlerRootView>
    </AuthProvider>
  );
}
