import React, { useCallback, useState, useMemo } from 'react'; // Added useMemo
import { RefreshControl, ScrollView, StyleSheet, View, Dimensions } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { HomeHeader } from '@/components/home/HomeHeader';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { CategoryList } from '@/components/home/CategoryList';
import { ProductGrid } from '@/components/home/ProductGrid';
// Import Skeleton Components
import { HeroCarouselSkeleton } from '@/components/home/skeletons/HeroCarouselSkeleton';
import { CategoryListSkeleton } from '@/components/home/skeletons/CategoryListSkeleton';
import { ProductGridSkeleton } from '@/components/home/skeletons/ProductGridSkeleton';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { Category, FeaturedHeroProduct, Product, PaginatedResponse } from '@/types/api';
import { api } from '@/utils/api';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedHeroProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  // Generate styles dynamically based on colors
  const styles = useMemo(() => createStyles(colors, colorScheme), [colors, colorScheme]);

  const fetchHomeData = async () => {
    setIsLoading(true);
    try {
      const [featuredData, categoriesData, productsData] = await Promise.all([
        api.home.getFeaturedProducts(),
        api.home.getCategories(),
        api.products.getAll(1, 6), // Use api utility and limit to 6
      ]);

      if (featuredData) setFeaturedProducts(featuredData);
      if (categoriesData) setCategories(categoriesData);
      if (productsData?.products) setProducts(productsData.products); // Access products from PaginatedResponse
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
      <HomeHeader />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        // Only show RefreshControl when not initially loading
        refreshControl={!isLoading ? <RefreshControl refreshing={false} onRefresh={fetchHomeData} /> : undefined}>
        {isLoading ? (
          // Show Skeletons when loading
          <>
            <View style={styles.section}>
              <HeroCarouselSkeleton />
            </View>
            <View style={styles.section}>
              <CategoryListSkeleton />
            </View>
            <View style={styles.section}>
              <ProductGridSkeleton />
            </View>
          </>
        ) : (
          // Show actual content when loaded
          <>
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
                    <ThemedText>View All</ThemedText>
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
                    <ThemedText>View All</ThemedText>
                  </Button>
                </View>
                <ProductGrid data={products.slice(0, 6)} />
              </View>
            )}
            {/* Add a fallback case if all content is empty after loading */}
            {!isLoading && featuredProducts?.length === 0 && categories?.length === 0 && products?.length === 0 && (
              <View style={styles.emptyContainer}>
                 <ThemedText>No content available.</ThemedText>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

// Define constants outside createStyles
const WINDOW_WIDTH = Dimensions.get('window').width;
const SPACING = WINDOW_WIDTH < 380 ? 12 : 16;

// createStyles function to generate styles based on colors
const createStyles = (colors: typeof Colors.light, colorScheme: 'light' | 'dark' | null) =>
  StyleSheet.create({
    container: {
      flex: 1,
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
    emptyContainer: { // Style for the fallback message
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: SPACING * 2,
    },
  });
