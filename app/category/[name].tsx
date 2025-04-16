import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ProductGrid } from '@/components/home/ProductGrid'; // Re-use ProductGrid
import { api } from '@/utils/api';
import type { Product } from '@/types/api';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function CategoryScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    const fetchProducts = async () => {
      if (!name) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.products.getByCategory(name);
        if (response.products) {
          setProducts(response.products);
        } else {
          setProducts([]); // Handle case where no products are returned
        }
      } catch (err) {
        console.error('Error fetching category products:', err);
        setError('Failed to load products. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [name]); // Re-fetch when category name changes

  return (
    <ThemedView style={styles.container}>
      {/* Add header styling */}
      <Stack.Screen
        options={{
          title: name ? decodeURIComponent(name) : 'Category',
          headerShown: true, // Explicitly show the header
          // headerBackTitleVisible: false, // Removed invalid option
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleAlign: 'center',
        }}
      />
      {/* Use View for centering states */}
      {isLoading ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centeredContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </View>
      ) : products.length > 0 ? (
        // Keep ScrollView only when products exist
        <ScrollView contentContainerStyle={styles.content}>
          <ProductGrid data={products} />
        </ScrollView> // Close ScrollView here
      ) : (
        // Render empty state within its own centered container
        <View style={styles.centeredContainer}>
          <ThemedText style={styles.emptyText}>No products found in this category.</ThemedText>
        </View> // Close View here
      )}
      {/* Remove the misplaced ScrollView closing tag */}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingVertical: 16, // Keep vertical padding for scroll
    // ProductGrid handles its own horizontal padding
  },
  centeredContainer: { // Style for centering loading/error/empty states
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    textAlign: 'center',
    color: 'red',
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    opacity: 0.7,
  },
});
