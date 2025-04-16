import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, Platform } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Search } from 'lucide-react-native'; // Import Lucide Search
// Removed IconSymbol import
import { Input } from '@/components/ui/Input';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { CategoryList } from '@/components/home/CategoryList';
import { ProductGrid } from '@/components/home/ProductGrid';
import { ThemedView } from '@/components/ThemedView';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { Category, FeaturedHeroProduct, Product, PaginatedResponse } from '@/types/api';
import { api } from '@/utils/api';

export default function HomeScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedHeroProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const fetchHomeData = async () => {
    setIsLoading(true);
    try {
      const [featuredData, categoriesData, productsData] = await Promise.all([
        api.home.getFeaturedProducts(),
        api.home.getCategories(),
        fetch('https://lelehaat.com/api/products').then((res) => res.json() as Promise<PaginatedResponse<Product>>),
      ]);

      // Update to handle direct array from getFeaturedProducts
      if (featuredData) setFeaturedProducts(featuredData);
      // Update to handle direct array from getCategories
      if (categoriesData) setCategories(categoriesData);
      if (productsData.products) setProducts(productsData.products);
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHomeData();
    }, [])
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Input
          placeholder="Search products..."
          containerStyle={styles.searchContainer}
          style={styles.searchInput}
          leftIcon={<Search size={20} color={colors.textSecondary} />} // Use Lucide Search
          onPressIn={() => router.push('/(tabs)/search')}
          editable={false}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchHomeData} />}>
        {featuredProducts?.length > 0 && (
          <View style={styles.section}>
            <HeroCarousel data={featuredProducts} />
          </View>
        )}
        {categories?.length > 0 && (
          <View style={styles.section}>
            <CategoryList data={categories} />
          </View>
        )}
        {products?.length > 0 && (
          <View style={styles.section}>
            <ProductGrid data={products} title="Latest Products" />
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: Platform.OS === 'ios' ? 60 : 40, // Adjust top padding for status bar
  },
  searchContainer: {
    marginBottom: 0, // Remove default margin from Input
  },
  searchInput: {
    backgroundColor: Colors.light.background, // Use theme color
    borderRadius: 20, // Make it more rounded
    paddingVertical: 8, // Adjust padding
  },
  content: {
    flexGrow: 1,
    paddingBottom: 30, // Add padding at the bottom
  },
  section: {
    marginBottom: 24, // Add space between sections
  },
});
