import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LogIn } from 'lucide-react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Define Color type based on Colors constant
type ColorTheme = typeof Colors.light & typeof Colors.dark;

// Reusable Login Prompt Component
export function LoginPrompt() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ThemedView style={styles.loginPromptContainer}>
      <LogIn size={48} color={colors.textSecondary} style={{ marginBottom: 16 }} />
      <ThemedText type="title" style={styles.loginPromptTitle}>
        Login Required
      </ThemedText>
      <ThemedText style={styles.loginPromptText}>
        Please log in to view this page and manage your information.
      </ThemedText>
      <Button style={styles.loginButton} onPress={() => router.push('/login')}>
        Go to Login
      </Button>
    </ThemedView>
  );
}

// Styles specifically for the LoginPrompt
const createStyles = (colors: ColorTheme) =>
  StyleSheet.create({
    loginPromptContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    loginPromptTitle: {
      marginBottom: 8,
      fontSize: 20,
    },
    loginPromptText: {
      textAlign: 'center',
      marginBottom: 24,
      opacity: 0.7,
    },
    loginButton: {
      minWidth: 200,
    },
    // Add other necessary styles if any (e.g., loadingContainer if needed within the prompt)
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      },
  });
