import React from 'react';
import { StyleSheet, View, Pressable, ActivityIndicator } from 'react-native'; // Import ActivityIndicator
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { Package, Heart, Settings, LogOut, ChevronRight, MapPin } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { LoginPrompt } from '@/components/ui/LoginPrompt'; // Import LoginPrompt

interface ProfileOptionProps {
  icon: React.ElementType;
  label: string;
  onPress: () => void;
  isLast?: boolean;
}

const ProfileOption: React.FC<ProfileOptionProps> = ({ icon: Icon, label, onPress, isLast }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.option, pressed && styles.optionPressed, isLast && styles.lastOption]}>
      <Icon size={22} color={colors.textSecondary} />
      <ThemedText style={styles.optionLabel}>{label}</ThemedText>
      <ChevronRight size={20} color={colors.textSecondary} style={styles.optionChevron} />
    </Pressable>
  );
};

export default function ProfileScreen() {
  const { user, logout, isLoading } = useAuth(); // Add isLoading
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Show loading indicator while auth state is resolving
  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  // Show login prompt if user is not logged in
  if (!user) {
    return <LoginPrompt />;
  }

  // Render profile content if user is logged in
  return (
    <ThemedView style={styles.container}>
      <View style={[styles.optionsContainer, { backgroundColor: colors.surface }]}>
        <ProfileOption icon={Package} label="My Orders" onPress={() => router.push('/orders')} />
        <ProfileOption icon={Heart} label="Wishlist" onPress={() => router.push('/(tabs)/wishlist')} />
        <ProfileOption icon={MapPin} label="Saved Addresses" onPress={() => router.push('/addresses')} />
        <ProfileOption icon={Settings} label="Account Settings" onPress={() => router.push('/settings/profile')} isLast />
      </View>

      <Button 
        onPress={logout} 
        style={styles.logoutButton}
        leftIcon={<LogOut size={18} color={colors.background} />}
      >
        Logout
      </Button>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 32, // Add padding to account for removed header
  },
  optionsContainer: {
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden', // Clip children to rounded corners
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border, // Use theme border color
  },
  optionPressed: {
    backgroundColor: Colors.light.border, // Use theme border color for pressed state
  },
  lastOption: {
    borderBottomWidth: 0,
  },
  optionLabel: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
  },
  optionChevron: {
    opacity: 0.5,
  },
  logoutButton: {
    marginTop: 'auto', // Push to bottom
    marginBottom: 16,
  },
  centerContent: { // Add style for centering loading indicator
    justifyContent: 'center',
    alignItems: 'center',
  },
});
