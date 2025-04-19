import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import SkeletonPlaceholder from '@/components/ui/SkeletonPlaceholder';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const { width: WINDOW_WIDTH } = Dimensions.get('window');
const getColumnCount = () => {
  if (WINDOW_WIDTH >= 1024) return 4;
  if (WINDOW_WIDTH >= 768) return 3;
  return 2;
};

const SPACING = 12;
const COLUMN_COUNT = getColumnCount();
const ITEM_WIDTH = (WINDOW_WIDTH - SPACING * (COLUMN_COUNT + 1)) / COLUMN_COUNT;
const IMAGE_HEIGHT = ITEM_WIDTH; // Assuming square image aspect ratio

export function ProductGridSkeleton() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  // Generate styles dynamically
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  // Calculate number of skeleton items based on column count (e.g., show 2 rows)
  const skeletonItems = Array(COLUMN_COUNT * 2).fill(0);

  return (
    <View style={styles.container}>
      {/* Skeleton for Section Header */}
      <View style={styles.sectionHeader}>
        <SkeletonPlaceholder width={180} height={24} borderRadius={4} />
        <SkeletonPlaceholder width={80} height={24} borderRadius={4} />
      </View>

      {/* Skeleton for Product Grid */}
      <View style={styles.gridContainer}>
        {skeletonItems.map((_, index) => (
          <View key={index} style={[styles.itemContainer, { width: ITEM_WIDTH }]}>
            {/* Image Skeleton */}
            <SkeletonPlaceholder
              width={ITEM_WIDTH}
              height={IMAGE_HEIGHT}
              borderRadius={12} // Match card border radius
              style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }} // Keep top radius
            />
            {/* Content Skeleton */}
            <View style={styles.contentSkeleton}>
              {/* Calculate pixel widths based on ITEM_WIDTH */}
              <SkeletonPlaceholder width={ITEM_WIDTH * 0.8} height={16} borderRadius={4} style={{ marginBottom: 6 }} />
              <SkeletonPlaceholder width={ITEM_WIDTH * 0.6} height={16} borderRadius={4} style={{ marginBottom: 8 }}/>
              <SkeletonPlaceholder width={ITEM_WIDTH * 0.4} height={20} borderRadius={4} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// Moved StyleSheet creation into a function that accepts colors
const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
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
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: SPACING,
  },
  itemContainer: {
    // Width is set dynamically
    marginBottom: SPACING,
    borderRadius: 12, // Match card border radius
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border, // Use theme border color from function argument
    overflow: 'hidden', // Clip content
    backgroundColor: colors.card, // Match card background from function argument
  },
  contentSkeleton: {
    padding: 10,
  },
});
