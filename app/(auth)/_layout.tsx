import { Stack, useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';
import { TouchableOpacity } from 'react-native'; // Removed BackHandler
import { ChevronLeft } from 'lucide-react-native';
// import { useEffect } from 'react'; // Removed useEffect

export default function AuthLayout() {
  // Removed useEffect for hardware back button handling
  // useEffect(() => {
  //   const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
  //     router.replace('/(tabs)');
  //     return true;
  //   });
  //
  //   return () => backHandler.remove();
  // }, []);

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
          headerBackVisible: true, // Show default back button if applicable
          headerLeft: undefined, // Removed custom headerLeft
          // Removed duplicate closing tag here
        }}
      />
      {/* <Stack.Screen
        name="register" // Removed as requested
        options={{
          title: 'Create Account',
        }}
      /> */}
      {/* <Stack.Screen
        name="forgot-password" // Removed as the file doesn't exist
        options={{
          title: 'Reset Password',
        }}
      /> */}
    </Stack>
  );
}
