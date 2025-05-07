import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router'; // Removed useRouter, useSegments as they are unused here
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState, createContext, useContext, useCallback, useMemo } from 'react'; // Added useMemo
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message'; // Import BaseToast, ErrorToast
import { useColorScheme } from '@/hooks/useColorScheme';
import { View, Text, StyleSheet } from 'react-native'; // Import View, Text, StyleSheet
import Colors from '@/constants/Colors';
import { AuthProvider, useAuth } from '@/context/AuthContext'; // Added useAuth
import { api } from '@/utils/api'; // Import api for cart fetching
import { useFocusEffect } from '@react-navigation/native'; // For cart updates on focus

// --- Cart Update Context ---
interface CartUpdateContextType {
  triggerCartUpdate: () => void;
  cartCount: number;
}
const CartUpdateContext = createContext<CartUpdateContextType | undefined>(undefined);

export const useCartUpdate = () => {
  const context = useContext(CartUpdateContext);
  if (!context) {
    throw new Error('useCartUpdate must be used within a CartUpdateProvider');
  }
  return context;
};
// --- End Cart Update Context ---

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
        <Stack.Screen
          name="wallet" // Add wallet screen
          options={{
            headerShown: true, // Show header for wallet
            title: 'My Wallet', // Set title here
            headerTintColor: Colors[colorScheme ?? 'light'].primary,
            headerBackButtonDisplayMode: 'minimal' // Correct property name
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
      <CartProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <RootLayoutNav />
          {/* Apply the custom config to the Toast component */}
          <Toast config={toastConfig} />
        </GestureHandlerRootView>
      </CartProvider>
    </AuthProvider>
  );
}

// CartProvider Component to encapsulate cart logic
function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartCount, setCartCount] = useState(0);
  const { user } = useAuth(); // Get user to decide on API vs local storage if needed

  const fetchCartCount = useCallback(async () => {
    try {
      // This logic assumes api.cart.getItems() works for both logged-in and guest users
      // or that guest cart is handled differently (e.g., via local storage directly in api.cart.getItems)
      // For simplicity, directly using api.cart.getItems as in (tabs)/_layout.tsx
      const items = await api.cart.getItems();
      const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      setCartCount(totalQuantity);
    } catch (error) {
      if (error instanceof Error && !error.message.includes('401') && !error.message.includes('User not authenticated')) {
        console.error('RootLayout: Failed to fetch cart count:', error);
      }
      setCartCount(0); // Reset on error or if not authenticated and API requires it
    }
  }, [user]); // Add user as dependency if cart fetching logic depends on auth state

  useEffect(() => {
    fetchCartCount();
  }, [fetchCartCount, user]); // Fetch initially and when user changes

  // Optional: Refetch on app focus or specific navigation events if needed globally
  // useFocusEffect(useCallback(() => { fetchCartCount(); }, [fetchCartCount]));

  const contextValue = useMemo(() => ({
    triggerCartUpdate: fetchCartCount,
    cartCount,
  }), [fetchCartCount, cartCount]);

  return (
    <CartUpdateContext.Provider value={contextValue}>
      {children}
    </CartUpdateContext.Provider>
  );
}
