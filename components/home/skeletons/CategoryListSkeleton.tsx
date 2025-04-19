import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import SkeletonPlaceholder from '@/components/ui/SkeletonPlaceholder';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const { width: WINDOW_WIDTH } = Dimensions.get('window');
const getColumnCount = () => {
  if (WINDOW_WIDTH >= 768) return 6;
  if (WINDOW_WIDTH >= 480) return 4;
  return 3;
};

const SPACING = 12;
const COLUMN_COUNT = getColumnCount();
const ITEM_WIDTH = (WINDOW_WIDTH - SPACING * (COLUMN_COUNT + 1)) / COLUMN_COUNT;
const ITEM_HEIGHT = ITEM_WIDTH; // Square items

export function CategoryListSkeleton() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Calculate number of skeleton items based on column count
  const skeletonItems = Array(COLUMN_COUNT).fill(0);

  return (
    <View style={styles.container}>
      {/* Skeleton for Section Header */}
      <View style={styles.sectionHeader}>
        <SkeletonPlaceholder width={150} height={24} borderRadius={4} />
        <SkeletonPlaceholder width={80} height={24} borderRadius={4} />
      </View>

      {/* Skeleton for Category Grid */}
      <View style={styles.gridContainer}>
        {skeletonItems.map((_, index) => (
          <View key={index} style={[styles.itemContainer, { width: ITEM_WIDTH }]}>
            <SkeletonPlaceholder
              width={ITEM_WIDTH}
              height={ITEM_HEIGHT}
              borderRadius={12}
            />
            {/* Optional: Add small text skeleton below */}
            <SkeletonPlaceholder
              width={ITEM_WIDTH * 0.7}
              height={14}
              borderRadius={4}
              style={styles.textSkeleton}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING,
    paddingVertical: SPACING,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Allow items to wrap
    justifyContent: 'flex-start', // Align items to the start
    gap: SPACING, // Use gap for spacing between items
  },
  itemContainer: {
    // Width is set dynamically
    marginBottom: SPACING, // Add bottom margin for vertical spacing
    alignItems: 'center', // Center text skeleton
  },
  textSkeleton: {
    marginTop: SPACING / 2,
  },
});
