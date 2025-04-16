import { Stack, useRouter } from 'expo-router'; // Import useRouter
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';
import { TouchableOpacity } from 'react-native';
import { ChevronLeft } from 'lucide-react-native'; // Import Lucide icon
// Removed IconSymbol import

export default function AuthLayout() {
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
      }}>
      <Stack.Screen
        name="login"
        options={{
          title: 'Login',
          headerShown: true,
          headerBackVisible: false, // Hide default back button
          headerLeft: () => { // Add custom back button
            // Get theme inside the render prop function to ensure correct context
            const currentScheme = useColorScheme();
            const iconColor = Colors[currentScheme ?? 'light'].primary;
            return (
              <TouchableOpacity
              onPress={() => router.push('/(tabs)')} // Navigate to Home tab explicitly
              style={{ marginLeft: 15, padding: 5 }}> {/* Added padding */}
              <ChevronLeft size={28} color={iconColor} /> {/* Use Lucide icon */}
              </TouchableOpacity>
            );
          },
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
