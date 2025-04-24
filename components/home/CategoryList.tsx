import React from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import type { Category } from '@/types/api';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Button } from '@/components/ui/Button';

const { width: WINDOW_WIDTH } = Dimensions.get('window');
// Dynamic column count based on screen width
const getColumnCount = () => {
  if (WINDOW_WIDTH >= 768) return 6; // Tablet landscape
  if (WINDOW_WIDTH >= 480) return 4; // Tablet portrait
  return 3; // Phone
};

const SPACING = 12;
const COLUMN_COUNT = getColumnCount();
const ITEM_WIDTH = (WINDOW_WIDTH - SPACING * (COLUMN_COUNT + 1)) / COLUMN_COUNT;

interface CategoryListProps {
  data: Category[];
  limit?: number;
  onViewAll?: () => void;
}

export function CategoryList({ data, limit, onViewAll }: CategoryListProps) {
  const [columns, setColumns] = React.useState(COLUMN_COUNT);

  // Update columns on dimension change
  React.useEffect(() => {
    const dimensionsHandler = Dimensions.addEventListener('change', () => {
      const { width } = Dimensions.get('window');
      if (width >= 768) setColumns(6);
      else if (width >= 480) setColumns(4);
      else setColumns(3);
    });

    return () => {
      dimensionsHandler.remove();
    };
  }, []);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = React.useMemo(() => createStyles(colors, colorScheme), [colors, colorScheme]);

  // Memoize the sorted and limited data
  const sortedAndLimitedData = React.useMemo(() => {
    return data
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .slice(0, limit);
  }, [data, limit]);

  const renderItem = ({ item }: { item: Category }) => (
    // Re-add Pressable and onPress handler to navigate using object syntax
    <Pressable
      style={[styles.itemContainer, { width: ITEM_WIDTH }]}
      onPress={() =>
        router.push({
          pathname: '/category/[name]',
          params: { name: item.name }, // Pass name as param
        })
      }>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Image source={{ uri: item.image }} style={styles.image} />
        <ThemedText style={styles.name}>{item.name}</ThemedText>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedAndLimitedData} // Use memoized data
        renderItem={renderItem}
        numColumns={columns}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
        columnWrapperStyle={styles.columnWrapper}
        key={columns} // Force remount on column change
      />
      {onViewAll && (
        <View style={styles.viewAllContainer}>
          <Button
            variant="ghost"
            onPress={onViewAll}
            style={styles.viewAllButton}
          >
            <ThemedText>View All Categories</ThemedText>
          </Button>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: typeof Colors.light, colorScheme: 'light' | 'dark' | null) => StyleSheet.create({
  container: {
    paddingHorizontal: SPACING, // Only horizontal padding for container
    paddingVertical: SPACING,
  },
  list: {
    // No gap needed here if columnWrapper has gap
  },
  columnWrapper: {
    gap: SPACING,
    justifyContent: 'flex-start',
    marginBottom: SPACING, // Add vertical spacing between rows
  },
  viewAllContainer: {
    paddingTop: SPACING,
    alignItems: 'center',
  },
  viewAllButton: {
    minWidth: 200,
  },
  itemContainer: {
    // Container for each item to manage width correctly
  },
  card: {
    flex: 1,
    borderRadius: 4, // Sharper corners
    padding: SPACING,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    minHeight: ITEM_WIDTH,
    borderWidth: 1, // Use 1 for a slightly more visible border
    borderColor: colors.border,
    // Removed Platform.select for shadow/elevation
  },
  image: {
    width: ITEM_WIDTH * 0.65,
    height: ITEM_WIDTH * 0.65,
    resizeMode: 'contain',
    marginBottom: SPACING,
  },
  name: {
    fontSize: WINDOW_WIDTH < 380 ? 12 : 14,
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.9,
    paddingHorizontal: 4,
  },
});
