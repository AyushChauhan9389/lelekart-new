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
          headerLeft: () => ( // Add custom back button
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10, padding: 5 }}>
              <ChevronLeft size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen // Restore register screen definition
        name="register"
        options={{
          title: 'Create Account',
        }}
      />
      {/* <Stack.Screen
        name="forgot-password" // Removed as the file doesn't exist
        options={{
          title: 'Reset Password',
        }}
      /> */}
    </Stack>
  );
}
