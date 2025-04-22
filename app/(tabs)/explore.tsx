import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Pressable,
  Image,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { api } from '@/utils/api';
import type { Product } from '@/types/api';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const { width: WINDOW_WIDTH } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const SPACING = 12;
const ITEM_WIDTH = (WINDOW_WIDTH - SPACING * (COLUMN_COUNT + 1)) / COLUMN_COUNT;

export default function ExploreScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const fetchProducts = useCallback(async (page: number, initialLoad = false) => {
    if (initialLoad) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);

    try {
      const response = await api.products.getAll(page, 10); // Fetch 10 products per page
      if (response.products && response.products.length > 0) {
        setProducts((prevProducts) => {
          if (page === 1) {
            return response.products!; // Replace for page 1
          } else {
            // Filter out duplicates before appending
            const existingIds = new Set(prevProducts.map(p => p.id));
            const newUniqueProducts = response.products!.filter(p => !existingIds.has(p.id));
            return [...prevProducts, ...newUniqueProducts];
          }
        });
        setTotalPages(response.pagination!.totalPages);
      } else {
        if (page === 1) setProducts([]); // Clear if first page has no products
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(1, true); // Fetch first page on mount
  }, [fetchProducts]);

  const handleLoadMore = () => {
    if (!isLoadingMore && currentPage < totalPages) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchProducts(nextPage);
    }
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    const imageSource = { uri: item.image_url || 'https://lelekart.in/images/electronics.svg' };
    return (
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
          </View>
        </View>
      </Pressable>
    );
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return <ActivityIndicator style={styles.footerLoader} size="large" color={colors.primary} />;
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  if (error && products.length === 0) {
    return (
      <ThemedView style={styles.centeredContainer}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Explore' }} />
      <FlatList
        data={products}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={COLUMN_COUNT}
        contentContainerStyle={styles.listContentContainer}
        columnWrapperStyle={styles.columnWrapper}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5} // Load more when halfway through the last item
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          !isLoading && !error ? ( // Show only if not loading and no error
            <ThemedText style={styles.emptyText}>No products found.</ThemedText>
          ) : null
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContentContainer: {
    padding: SPACING / 2, // Add padding around the grid
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: SPACING,
  },
  item: {
    width: ITEM_WIDTH,
    borderRadius: 8,
    overflow: 'hidden',
    marginHorizontal: SPACING / 2, // Add horizontal margin for spacing
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    resizeMode: 'cover',
  },
  content: {
    padding: 10,
  },
  name: {
    fontSize: 14,
    marginBottom: 4,
    minHeight: 34, // Ensure consistent height for 2 lines
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 'auto', // Push price to bottom
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
  },
  mrp: {
    fontSize: 12,
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  footerLoader: {
    marginVertical: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    opacity: 0.7,
  },
});
