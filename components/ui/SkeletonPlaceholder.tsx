import React, { useEffect } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { useColorScheme } from '@/hooks/useColorScheme';
import Colors from '@/constants/Colors';
import { DimensionValue } from 'react-native'; // Import DimensionValue if needed, but let's try number first

interface SkeletonPlaceholderProps {
  width: number; // Changed to number only
  height: number; // Changed to number only
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

const SkeletonPlaceholder: React.FC<SkeletonPlaceholderProps> = ({
  width,
  height,
  borderRadius = 4,
  style,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const shimmerProgress = useSharedValue(0);

  useEffect(() => {
    shimmerProgress.value = withRepeat(
      withTiming(1, {
        duration: 1200,
        easing: Easing.bezier(0.4, 0.0, 0.6, 1.0), // Smoother easing
      }),
      -1, // Repeat indefinitely
      false // Don't reverse
    );
  }, [shimmerProgress]);

  // Animated style now only controls the background color
  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      shimmerProgress.value,
      [0, 0.5, 1],
      [
        colors.border, // Start color
        colors.surface, // Middle color
        colors.border, // End color
      ]
    );
    return {
      backgroundColor,
    };
  });

  // Use a standard View for layout and nest Animated.View for the background
  // No need for explicit layoutStyle object now

  return (
    // Apply width, height, borderRadius directly in the style array
    <View style={[styles.container, { width, height, borderRadius }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { // Renamed from placeholder
    overflow: 'hidden', // Keep overflow hidden on the container
  },
  // placeholder style removed as Animated.View uses absoluteFill
});

export default SkeletonPlaceholder;
