import React from 'react';
import { Dimensions, Image, Pressable, StyleSheet, View, FlatList } from 'react-native'; // Import FlatList
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { Product } from '@/types/api';

interface ProductGridProps {
  data: Product[];
  title?: string;
}

const { width: WINDOW_WIDTH } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const SPACING = 12;
const ITEM_WIDTH = (WINDOW_WIDTH - SPACING * (COLUMN_COUNT + 1)) / COLUMN_COUNT;

export function ProductGrid({ data, title }: ProductGridProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Correct renderItem function syntax
  const renderItem = ({ item }: { item: Product }) => {
    // Define the image source, using fallback if item.image_url is missing
    const imageSource = { uri: item.image_url || 'https://lelehaat.com/images/electronics.svg' };

    return ( // Ensure return statement is correct
      <Pressable
        style={[styles.item, { backgroundColor: colors.card }]}
      onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id.toString() } })}>
      <Image source={imageSource} style={styles.image} />
      <View style={styles.content}>
        <ThemedText numberOfLines={2} style={styles.name}>
          {item.name}
        </ThemedText>
        <View style={styles.priceContainer}>
          <ThemedText type="subtitle" style={styles.price}>
            ₹{item.price}
          </ThemedText>
          {item.mrp > item.price && (
            <ThemedText style={styles.mrp}>₹{item.mrp}</ThemedText>
          )}
          {/* Removed extra closing parenthesis from here */}
        </View>
      </View>
    </Pressable>
    ); // Close the returned JSX element
  }; // Add missing closing brace for renderItem function

  return (
    <ThemedView style={styles.container}>
      {title && (
        <ThemedText type="subtitle" style={styles.title}>
          {title}
        </ThemedText>
      )}
      {/* Use FlatList for the grid */}
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item: Product) => item.id.toString()} // Add type annotation for item
        numColumns={COLUMN_COUNT}
        scrollEnabled={false} // Disable scroll if used within another ScrollView
        contentContainerStyle={styles.listContentContainer}
        columnWrapperStyle={styles.columnWrapper} // Style for rows
        ListEmptyComponent={
          <ThemedText style={styles.emptyText}>No products found.</ThemedText>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING,
  },
  title: {
    fontSize: 20,
    fontWeight: '600', // Remove duplicate fontWeight
    marginBottom: SPACING,
    paddingHorizontal: SPACING / 2, // Align title padding
  },
  listContentContainer: {
    // paddingHorizontal: SPACING / 2, // Add horizontal padding if needed
  },
  columnWrapper: {
    justifyContent: 'space-between', // Distribute items evenly in the row
    marginBottom: SPACING, // Add space between rows
  },
  item: {
    width: ITEM_WIDTH, // Set fixed width for each item
    borderRadius: 8, // Slightly smaller border radius
    overflow: 'hidden',
    // Add shadow/elevation for card effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    resizeMode: 'cover', // Keep cover for product images
  },
  content: {
    padding: 10, // Adjust padding
  },
  name: {
    fontSize: 14,
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
  },
  mrp: {
    fontSize: 12, // Smaller MRP text
    textDecorationLine: 'line-through',
    opacity: 0.6, // Slightly more faded
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    opacity: 0.7,
  },
});
