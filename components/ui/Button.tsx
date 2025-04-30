import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import React from 'react';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: any;
  children: React.ReactNode; // Change type to React.ReactNode
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  children,
  leftIcon,
  rightIcon,
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getBackgroundColor = () => {
    if (disabled) return colors.textSecondary;
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.secondary;
      case 'outline':
      case 'ghost':
        return 'transparent';
      default:
        return colors.primary;
    }
  };

  const getBorderColor = () => {
    if (disabled) return colors.textSecondary;
    switch (variant) {
      case 'outline':
        return colors.primary;
      default:
        return 'transparent';
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.background;
    switch (variant) {
      case 'primary':
      case 'secondary':
        return colors.background;
      case 'outline':
      case 'ghost':
        return colors.primary;
      default:
        return colors.background;
    }
  };

  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 8, paddingHorizontal: 16 };
      case 'lg':
        return { paddingVertical: 16, paddingHorizontal: 24 };
      default:
        return { paddingVertical: 12, paddingHorizontal: 20 };
    }
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          width: fullWidth ? '100%' : 'auto',
        },
        getSizeStyles(),
        style,
      ]}>
      <View style={styles.content}>
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        {typeof children === 'string' ? (
          <Text
            style={[
              styles.text,
              {
                color: getTextColor(),
                fontSize: size === 'sm' ? 14 : size === 'lg' ? 18 : 16,
              },
              textStyle,
            ]}>
            {children}
          </Text>
        ) : (
          children
        )}
        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
