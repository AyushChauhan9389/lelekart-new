import React from 'react';
import { StyleSheet, View, Pressable, Platform } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemedText } from '@/components/ThemedText';

interface NavigationHeaderProps {
  title: string;
  onBack?: () => void;
}

export function NavigationHeader({ title, onBack }: NavigationHeaderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }}>
      <View style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
          ...Platform.select({
            ios: {
              shadowColor: colorScheme === 'dark' ? colors.background : colors.text,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: colorScheme === 'dark' ? 0.3 : 0.1,
              shadowRadius: 4,
            },
            android: {
              elevation: 4,
            },
          }),
        }
      ]}>
        <Pressable
          onPress={handleBack}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={24} color={colors.text} />
        </Pressable>

        <ThemedText style={styles.title} numberOfLines={1}>
          {title}
        </ThemedText>

        {/* Empty View for centering */}
        <View style={styles.rightPlaceholder} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: Platform.OS === 'ios' ? 44 : 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: 12,
    marginLeft: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  rightPlaceholder: {
    width: 48, // Same width as back button for centering
  },
});
