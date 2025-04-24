import React, { useCallback, useState, useMemo, useEffect, useRef } from 'react'; // Import useRef
import { RefreshControl, ScrollView, StyleSheet, View, Dimensions, TouchableOpacity, NativeSyntheticEvent, NativeScrollEvent } from 'react-native'; // Import TouchableOpacity, event types
import { router } from 'expo-router';
import { ArrowUp } from 'lucide-react-native'; // Import icon
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
  const [showGoTopButton, setShowGoTopButton] = useState(false); // State for button visibility
  const scrollViewRef = useRef<ScrollView>(null); // Ref for ScrollView

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
        api.products.getAll(1, 10), // Fetch 10 products
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

  // Initial data fetch only
  useEffect(() => {
    if (featuredProducts.length === 0 && categories.length === 0 && products.length === 0) {
      fetchHomeData();
    }
  }, []);

  // Manual refresh handler
  const handleRefresh = useCallback(() => {
    fetchHomeData();
  }, []); // Empty dependency array for handleRefresh, fetchHomeData is stable

  // Scroll handler to show/hide button
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    // Show button if scrolled down more than, say, half the screen height
    setShowGoTopButton(event.nativeEvent.contentOffset.y > Dimensions.get('window').height / 2);
  };

  // Function to scroll to top
  const goToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  return (
    <ThemedView style={styles.container}>
      <HomeHeader />

      <ScrollView
        ref={scrollViewRef} // Attach ref
        onScroll={handleScroll} // Attach scroll handler
        scrollEventThrottle={16} // Throttle scroll events for performance
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        // Only show RefreshControl when not initially loading
        refreshControl={
          <RefreshControl 
            refreshing={isLoading} 
            onRefresh={handleRefresh}
          />
        }>
        {isLoading ? (
          // Show Skeletons when loading
          <>
            <View style={styles.section}>
              <HeroCarouselSkeleton />
            </View>
            {/* <View style={styles.section}>
              <CategoryListSkeleton />
            </View> */}
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
                <ProductGrid data={products} /> 
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

      {/* Go to Top Button */}
      {showGoTopButton && (
        <TouchableOpacity
          style={[styles.goToTopButton, { backgroundColor: colors.primary }]}
          onPress={goToTop}
        >
          <ArrowUp size={24} color={colors.background} />
        </TouchableOpacity>
      )}
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
    goToTopButton: { // Style for Go to Top button
      position: 'absolute',
      bottom: 30,
      right: 20,
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5, // Android shadow
      shadowColor: '#000', // iOS shadow
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
  });
