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
// Dynamic column count based on screen width
const getColumnCount = () => {
  if (WINDOW_WIDTH >= 1024) return 4; // Large tablets/desktop
  if (WINDOW_WIDTH >= 768) return 3;  // Tablets
  return 2; // Phones
};

const SPACING = 12;
const COLUMN_COUNT = getColumnCount();
const ITEM_WIDTH = (WINDOW_WIDTH - SPACING * (COLUMN_COUNT + 1)) / COLUMN_COUNT;

export function ProductGrid({ data, title }: ProductGridProps) {
  const [columns, setColumns] = React.useState(COLUMN_COUNT);
  
  // Update columns on dimension change
  React.useEffect(() => {
    const dimensionsHandler = Dimensions.addEventListener('change', () => {
      const { width } = Dimensions.get('window');
      if (width >= 1024) setColumns(4);
      else if (width >= 768) setColumns(3);
      else setColumns(2);
    });

    return () => {
      dimensionsHandler.remove();
    };
  }, []);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Correct renderItem function syntax
  const renderItem = ({ item }: { item: Product }) => {
    // Define the image source, using fallback if item.image_url is missing
    const imageSource = { uri: item.image_url || 'https://lelekart.in/images/electronics.svg' };

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
        numColumns={columns}
        key={columns}
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
    flex: 1,
    margin: SPACING / 2,
    maxWidth: (WINDOW_WIDTH - SPACING * 3) / 2, // Ensure items don't get too wide
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.light.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    fontSize: WINDOW_WIDTH < 380 ? 13 : 14,
    marginBottom: 6,
    lineHeight: 20,
    minHeight: 40, // Ensure consistent height for product names
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    fontSize: WINDOW_WIDTH < 380 ? 15 : 17,
    fontWeight: '600',
    color: Colors.light.primary,
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
