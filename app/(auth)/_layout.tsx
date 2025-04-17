import { Stack, useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';
import { TouchableOpacity, BackHandler } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useEffect } from 'react';

export default function AuthLayout() {
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      router.replace('/(tabs)');
      return true;
    });

    return () => backHandler.remove();
  }, []);

  const colorScheme = useColorScheme();
  const router = useRouter(); // Add router hook
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.primary,
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}>
      <Stack.Screen
        name="login"
        options={{
          title: 'Login',
          headerShown: true,
          headerBackVisible: false, // Hide default back button
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.replace('/(tabs)')}
              style={{ marginLeft: 15, padding: 5 }}>
              <ChevronLeft size={28} color={colors.primary} />
            </TouchableOpacity>
          ),
          // Removed duplicate closing tag here
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          title: 'Create Account',
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          title: 'Reset Password',
        }}
      />
    </Stack>
  );
}
