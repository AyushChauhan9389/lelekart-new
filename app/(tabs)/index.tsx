import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, Platform, Dimensions } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Search } from 'lucide-react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { CategoryList } from '@/components/home/CategoryList';
import { ProductGrid } from '@/components/home/ProductGrid';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
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
        fetch('https://lelekart.in/api/products').then((res) => res.json() as Promise<PaginatedResponse<Product>>),
      ]);

      if (featuredData) setFeaturedProducts(featuredData);
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
          leftIcon={<Search size={20} color={colors.textSecondary} />}
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
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>Shop by Category</ThemedText>
              <Button 
                variant="ghost"
                onPress={() => router.push('/categories')}
                style={styles.viewAllButton}
              >
                View All
              </Button>
            </View>
            <CategoryList data={categories} limit={6} />
          </View>
        )}
        {products?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>Latest Products</ThemedText>
              <Button 
                variant="ghost"
                onPress={() => router.push('/(tabs)/explore')}
                style={styles.viewAllButton}
              >
                View All
              </Button>
            </View>
            <ProductGrid data={products.slice(0, 6)} />
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const WINDOW_WIDTH = Dimensions.get('window').width;
const SPACING = WINDOW_WIDTH < 380 ? 12 : 16;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING,
    paddingBottom: SPACING,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchContainer: {
    marginBottom: 0,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  searchInput: {
    backgroundColor: Colors.light.background,
    borderRadius: 20,
    paddingVertical: WINDOW_WIDTH < 380 ? 8 : 10,
    fontSize: WINDOW_WIDTH < 380 ? 14 : 16,
  },
  content: {
    flexGrow: 1,
    paddingBottom: SPACING * 2,
  },
  section: {
    marginTop: SPACING,
    marginBottom: SPACING,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING,
    marginBottom: SPACING,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  viewAllButton: {
    minHeight: 32,
  },
});
