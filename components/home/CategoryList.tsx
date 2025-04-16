import React from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import type { Category } from '@/types/api';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface CategoryListProps {
  data: Category[];
}

const { width: WINDOW_WIDTH } = Dimensions.get('window');
const COLUMN_COUNT = 4; // Increase column count
const SPACING = 10; // Adjust spacing
const ITEM_WIDTH = (WINDOW_WIDTH - SPACING * (COLUMN_COUNT + 1)) / COLUMN_COUNT;

export function CategoryList({ data }: CategoryListProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

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
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        Shop by Category
      </ThemedText>
      <FlatList
        data={data.sort((a, b) => a.displayOrder - b.displayOrder)}
        renderItem={renderItem}
        numColumns={COLUMN_COUNT}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
        columnWrapperStyle={styles.columnWrapper}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING, // Only horizontal padding for container
    paddingVertical: SPACING,
  },
  sectionTitle: {
    fontSize: 18, // Adjust size
    fontWeight: '600',
    marginBottom: SPACING + 4, // More space below title
    paddingHorizontal: SPACING / 2, // Align with item padding
  },
  list: {
    // No gap needed here if columnWrapper has gap
  },
  columnWrapper: {
    gap: SPACING,
    justifyContent: 'flex-start', // Align items to start
  },
  itemContainer: {
    // Container for each item to manage width correctly
  },
  card: {
    flex: 1, // Ensure card takes full height within container if needed
    borderRadius: 8,
    padding: SPACING,
    alignItems: 'center', // Center content horizontally
    justifyContent: 'center', // Center content vertically
    // Add shadow/elevation if desired
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  image: {
    width: ITEM_WIDTH * 0.5, // Adjust image size relative to item width
    height: ITEM_WIDTH * 0.5, // Make image square or adjust aspect ratio
    resizeMode: 'contain', // Use contain to show full icon
    marginBottom: SPACING / 2, // Space between image and text
  },
  name: {
    fontSize: 12, // Smaller font size
    fontWeight: '500',
    textAlign: 'center', // Center text
    marginTop: SPACING / 2,
  },
});
