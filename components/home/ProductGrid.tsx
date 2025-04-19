import React from 'react';
import { Dimensions, Image, Pressable, StyleSheet, View, FlatList, Platform } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { Product } from '@/types/api';

interface ProductGridProps {
  data: Product[];
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

export function ProductGrid({ data }: ProductGridProps) {
  const [columns, setColumns] = React.useState(COLUMN_COUNT);
  
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
  // Generate styles dynamically based on colors
  const styles = React.useMemo(() => createStyles(colors, colorScheme), [colors, colorScheme]);

  const renderItem = ({ item }: { item: Product }) => {
    const imageSource = { uri: item.image_url || 'https://lelekart.in/images/electronics.svg' };

    return (
      <Pressable
        style={[styles.item, { backgroundColor: colors.card }]} // Keep dynamic background color here
        onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id.toString() } })}
      >
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
              <>
                <ThemedText style={styles.mrp}>₹{item.mrp}</ThemedText>
                <ThemedText style={styles.discount}>
                  {Math.round(((item.mrp - item.price) / item.mrp) * 100)}% off
                </ThemedText>
              </>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item: Product) => item.id.toString()}
        numColumns={columns}
        key={columns}
        scrollEnabled={false}
        contentContainerStyle={styles.listContentContainer}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={
          <ThemedText style={styles.emptyText}>No products found.</ThemedText>
        }
      />
    </ThemedView>
  );
}

// Moved StyleSheet creation into a function that accepts colors
const createStyles = (colors: typeof Colors.light, colorScheme: 'light' | 'dark' | null) => StyleSheet.create({
  container: {
    padding: SPACING, // Keep padding on the outer container
  },
  listContentContainer: {
    // Empty for now as padding is handled by container
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: SPACING,
  },
  item: {
    flex: 1,
    margin: SPACING / 2,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colorScheme === 'dark' ? '#000' : '#666',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    resizeMode: 'cover',
  },
  content: {
    padding: SPACING,
    backgroundColor: colors.card,
  },
  name: {
    fontSize: WINDOW_WIDTH < 380 ? 13 : 14,
    marginBottom: SPACING / 2,
    lineHeight: 20,
    minHeight: 40,
    opacity: 0.9,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING,
    marginTop: SPACING / 2,
  },
  price: {
    fontSize: WINDOW_WIDTH < 380 ? 16 : 18,
    fontWeight: '700',
    color: colors.primary,
  },
  mrp: {
    fontSize: WINDOW_WIDTH < 380 ? 12 : 13,
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  discount: {
    fontSize: WINDOW_WIDTH < 380 ? 11 : 12,
    color: colors.success,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    opacity: 0.7,
  },
});
