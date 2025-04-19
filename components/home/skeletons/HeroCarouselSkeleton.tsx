import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import SkeletonPlaceholder from '@/components/ui/SkeletonPlaceholder';

const { width: WINDOW_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = Math.min(WINDOW_WIDTH, 1200);
const ITEM_HEIGHT = WINDOW_WIDTH >= 768 ? 400 : WINDOW_WIDTH >= 480 ? 300 : 250;
const BORDER_RADIUS = WINDOW_WIDTH >= 768 ? 20 : 0;

export function HeroCarouselSkeleton() {
  return (
    <View style={styles.container}>
      <SkeletonPlaceholder
        width={ITEM_WIDTH}
        height={ITEM_HEIGHT}
        borderRadius={BORDER_RADIUS}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center', // Center the placeholder if window width < 1200
  },
});
