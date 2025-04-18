import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router'; // Import useRouter, useSegments
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';
import { AuthProvider, useAuth } from '@/context/AuthContext'; // Import AuthProvider and useAuth

// Custom hook to manage redirection based on auth state
function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return; // Don't redirect until auth state is loaded

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const protectedTabs = ['cart', 'profile', 'wishlist']; // Define protected tab routes

    // Check if we are in a protected tab route (ensure segment[1] exists)
    const isProtectedRoute = (
      // Check protected tab routes
      (inTabsGroup && segments[1] && protectedTabs.includes(segments[1])) ||
      // Check other protected routes
      segments[0] === 'orders' ||
      segments[0] === 'addresses' ||
      segments[0] === 'settings'
    );

    if (!user && isProtectedRoute) {
      // Redirect to login if user is not signed in and accessing a protected route
      router.push('/login');
    } else if (user && inAuthGroup) {
      // Redirect away from auth screens if user is signed in
      router.replace('/');
    }
  }, [user, segments, isLoading, router]);
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Main RootLayoutNav component
function RootLayoutNav() {
  const colorScheme = useColorScheme();
  useProtectedRoute(); // Apply protected route logic

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
            headerShown: true,
            headerTitle: '',
            headerTransparent: true,
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
      </GestureHandlerRootView>
    </AuthProvider>
  );
}
