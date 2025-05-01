import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { storage } from '@/utils/storage';
import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Pressable,
  Image,
  TouchableOpacity,
  Platform,
  NativeSyntheticEvent, // Import event types
  NativeScrollEvent,
} from 'react-native';
import { Stack, router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Heart, ShoppingCart, ArrowUp } from 'lucide-react-native'; // Import ArrowUp
import { useAuth } from '@/context/AuthContext';
import { api } from '@/utils/api';
import { Button } from '@/components/ui/Button'; // Import Button
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
  // Removed isLoadingMore state
  const [error, setError] = useState<string | null>(null);
  const [showGoTopButton, setShowGoTopButton] = useState(false); // State for button
  const flatListRef = useRef<FlatList>(null); // Ref for FlatList

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  // Generate styles dynamically based on colors
  const styles = useMemo(() => createStyles(colors, colorScheme), [colors, colorScheme]);
  const { user } = useAuth(); // Get user

  // Removed useCallback wrapper
  const fetchProducts = async (page: number) => {
    setIsLoading(true);
    setError(null);
    // Note: goToTop is now called in useEffect before this function

    try {
      const limit = 10;
      console.log(`[ExploreScreen] Fetching page ${page}, limit ${limit}`); // Log request
      const response = await api.products.getAll(page, limit);
      console.log('[ExploreScreen] API Response:', JSON.stringify(response, null, 2)); // Log raw response

      // Access data based on the actual API response structure
      if (response && response.products && response.pagination && typeof response.pagination.total === 'number') {
        console.log(`[ExploreScreen] Setting products for page ${page}:`, response.products.length, 'items'); // Log product count
        setProducts(response.products); // Use response.products
        // Calculate total pages using response.pagination.total or response.pagination.totalPages
        const totalItems = response.pagination.total;
        const calculatedTotalPages = response.pagination.totalPages ?? Math.max(1, Math.ceil(totalItems / limit)); // Prefer totalPages if available
        console.log(`[ExploreScreen] Setting total pages: ${calculatedTotalPages} (Total items: ${totalItems})`); // Log total pages calculation
        setTotalPages(calculatedTotalPages);
      } else {
         console.warn('[ExploreScreen] API response missing products or pagination details, or invalid format. Response:', response); // Updated warning
         setProducts([]);
         setTotalPages(1);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products.');
      setProducts([]);
      setTotalPages(1); // Ensure totalPages is 1 on error
    } finally {
      setIsLoading(false);
    }
  }; // Removed useCallback wrapper and its empty dependency array

  // Fetch products when currentPage changes
  useEffect(() => {
    // Scroll to top before fetching new page data
    goToTop();
    fetchProducts(currentPage);
    // Only depend on currentPage. fetchProducts is stable now.
  }, [currentPage]);

  // Removed handleLoadMore

  // Scroll handler for Explore screen
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setShowGoTopButton(event.nativeEvent.contentOffset.y > Dimensions.get('window').height / 2);
  };

  // Go to top handler for Explore screen
  const goToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  // -- Render Item Component for Explore Tab --
  const ProductExploreItem = ({ item, styles, colors }: { item: Product, styles: any, colors: any }) => {
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [updatingWishlist, setUpdatingWishlist] = useState(false);
    const [addingToCart, setAddingToCart] = useState(false);

    // Check wishlist status
    useEffect(() => {
      let isMounted = true;
      const checkStatus = async () => {
        setUpdatingWishlist(true);
        try {
          if (user && item) {
            // Check server wishlist if logged in
            const { inWishlist } = await api.wishlist.checkItem(item.id);
            if (isMounted) setIsInWishlist(inWishlist);
          } else if (item) {
            // Check local storage if not logged in
            const items = await storage.wishlist.getItems();
            if (isMounted) {
              setIsInWishlist(items.some(wishlistItem => wishlistItem.productId === item.id));
            }
          }
        } catch (error) {
          if (isMounted && !(error instanceof Error && error.message.includes('404'))) {
            console.error(`Explore: Failed wishlist check for item ${item.id}:`, error);
          }
        } finally {
          if (isMounted) setUpdatingWishlist(false);
        }
      };
      checkStatus();
      return () => { isMounted = false; };
    }, [user, item]);

    const handleWishlistToggle = async () => {
      if (updatingWishlist || !item) return;
      setUpdatingWishlist(true);
      try {
        let message = '';
        if (user) {
          // Use server API if logged in
          if (isInWishlist) {
            await api.wishlist.removeItem(item.id);
            message = 'Removed from Wishlist';
          } else {
            await api.wishlist.addItem(item.id);
            message = 'Added to Wishlist';
          }
        } else {
          // Use local storage if not logged in
          if (isInWishlist) {
            await storage.wishlist.removeItem(item.id);
            message = 'Removed from Wishlist';
          } else {
            await storage.wishlist.addItem(item);
            message = 'Added to Wishlist';
          }
        }
        setIsInWishlist(!isInWishlist);
        Toast.show({ type: 'success', text1: message, position: 'bottom' });
      } catch (error) {
        console.error('Explore: Failed wishlist update:', error);
        Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to update wishlist.', position: 'bottom' });
      } finally {
        setUpdatingWishlist(false);
      }
    };

    const handleAddToCart = async () => {
      if (addingToCart || !item) return;
      setAddingToCart(true);
      try {
        if (user) {
          // Add to server cart if logged in
          await api.cart.addItem(item.id, 1);
        } else {
          // Add to local storage cart if not logged in
          await storage.cart.addItem(item, 1);
        }
        Toast.show({ type: 'success', text1: 'Added to Cart', text2: `${item.name} added.`, position: 'bottom' });
      } catch (error) {
        console.error('Explore: Failed add to cart:', error);
        Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to add item to cart.', position: 'bottom' });
      } finally {
        setAddingToCart(false);
      }
    };

    const imageSource = { uri: item.image_url || 'https://lelekart.in/images/electronics.svg' };
    const showMrp = item.mrp !== null && item.mrp > item.price;

    return (
      <Pressable
        style={[styles.item, { backgroundColor: colors.card }]}
        onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id.toString() } })}>
        {/* Image Container */}
        <View style={styles.imageContainer}>
          <Image source={imageSource} style={styles.image} />
           {/* Wishlist Button Overlay */}
           <TouchableOpacity
             style={[styles.overlayButton, styles.wishlistButton]}
             onPress={handleWishlistToggle}
             disabled={updatingWishlist}
           >
            {updatingWishlist ? (
              <ActivityIndicator size="small" color={colors.textSecondary} />
            ) : (
              <Heart
                size={18}
                color={isInWishlist ? colors.error : colors.textSecondary}
                fill={isInWishlist ? colors.error : 'none'}
              />
            )}
           </TouchableOpacity>
        </View>
        {/* Content */}
        <View style={styles.content}>
           <ThemedText numberOfLines={2} style={styles.name}>
            {item.name}
          </ThemedText>
          <View style={styles.priceContainer}>
            <ThemedText type="subtitle" style={styles.price}>
              ₹{item.price}
            </ThemedText>
            {/* Use the refined condition and add discount */}
            {showMrp && (
              <>
                <ThemedText style={styles.mrp}>₹{item.mrp.toString()}</ThemedText>
                <ThemedText style={styles.discount}>
                  {Math.round(((item.mrp - item.price) / item.mrp) * 100)}% off
                </ThemedText>
              </>
            )}
           </View>
           {/* Add to Cart Button Below Content */}
           <Button
             onPress={handleAddToCart}
             disabled={addingToCart}
             style={styles.addToCartButton}
             size="sm"
             leftIcon={!addingToCart ? <ShoppingCart size={16} color={colors.background} /> : undefined}
           >
             {addingToCart ? 'Adding...' : 'Add to Cart'}
           </Button>
         </View>
      </Pressable>
    );
  };
   // -- End Render Item Component --

  // Memoized callback for renderItem
  const renderProductItemCallback = useCallback(({ item }: { item: Product }) => (
    <ProductExploreItem item={item} styles={styles} colors={colors} />
  ), [styles, colors]); // Depend on styles and colors

  // Removed renderFooter for infinite scroll loader

  // Pagination Handlers
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Render Pagination Controls
  const renderPaginationControls = () => {
    if (totalPages <= 1) return null; // Don't show controls for 1 or less pages

    return (
      <View style={styles.paginationContainer}>
        <Button
          onPress={handlePreviousPage}
          disabled={currentPage === 1 || isLoading}
          variant="outline"
          size="sm"
        >
          Previous
        </Button>
        <ThemedText style={styles.pageInfoText}>
          Page {currentPage} of {totalPages}
        </ThemedText>
        <Button
          onPress={handleNextPage}
          disabled={currentPage >= totalPages || isLoading}
          variant="outline"
          size="sm"
        >
          Next
        </Button>
      </View>
    );
  };

  // Show initial loading indicator only for the first page load
  if (isLoading && currentPage === 1) {
    return (
      <ThemedView style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  // Show error message if there's an error and no products could be loaded initially
  if (error && currentPage === 1 && products.length === 0) {
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
        renderItem={renderProductItemCallback} // Use the callback
        keyExtractor={(item) => item.id.toString()}
        numColumns={COLUMN_COUNT}
        contentContainerStyle={styles.listContentContainer}
        columnWrapperStyle={styles.columnWrapper}
        ref={flatListRef} // Attach ref
        onScroll={handleScroll} // Attach scroll handler
        scrollEventThrottle={16} // Throttle scroll events
        // Removed onEndReached, onEndReachedThreshold, ListFooterComponent
        ListEmptyComponent={
          // Show empty message only when not loading, no error, and products array is empty
          !isLoading && !error && products.length === 0 ? (
            <View style={styles.centeredContainer}>
              <ThemedText style={styles.emptyText}>No products found.</ThemedText>
            </View>
          ) : null
        }
      />
      {/* Show error message below list if an error occurred on subsequent loads */}
      {error && currentPage > 1 && (
         <View style={styles.errorFooter}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
         </View>
      )}
      {/* Go to Top Button */}
      {showGoTopButton && (
        <TouchableOpacity
          style={[styles.goToTopButton, { backgroundColor: colors.primary }]}
          onPress={goToTop}
        >
          <ArrowUp size={24} color={colors.background} />
        </TouchableOpacity>
      )}
      {/* Render Pagination Controls */}
      {renderPaginationControls()}
    </ThemedView>
  );
}

// Moved StyleSheet creation into a function
const createStyles = (colors: typeof Colors.light, colorScheme: 'light' | 'dark' | null) => StyleSheet.create({
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
    borderRadius: 4, // Sharper corners
    overflow: 'hidden',
    marginHorizontal: SPACING / 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
   imageContainer: { // Added container
     position: 'relative',
   },
  image: {
    width: '100%',
    aspectRatio: 1,
    resizeMode: 'contain',
    backgroundColor: '#f8f8f8',
  },
   overlayButton: { // Added overlay button styles
     position: 'absolute',
     width: 32,
     height: 32,
     borderRadius: 16,
     backgroundColor: 'rgba(255, 255, 255, 0.85)',
     justifyContent: 'center',
     alignItems: 'center',
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 1 },
     shadowOpacity: 0.15,
     shadowRadius: 2,
     elevation: 3,
   },
   wishlistButton: { // Added wishlist button position
     top: 6,
     right: 6,
   },
   cartButton: { // Added cart button position
     bottom: 6,
     right: 6,
     backgroundColor: colors.background,
     borderColor: colors.border,
     borderWidth: 1,
  },
  // Removed cartButton style
  content: {
    padding: SPACING * 0.75,
  },
  name: {
    fontSize: 14,
    marginBottom: 2, // Reduced margin
    minHeight: 34,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING / 2,
    marginTop: SPACING / 4, // Reduced margin
    flexWrap: 'wrap',
    marginBottom: SPACING * 0.5,
  },
  price: {
    fontSize: WINDOW_WIDTH < 380 ? 16 : 18, // Match ProductGrid size
    fontWeight: '700', // Match ProductGrid weight
    color: colors.primary, // Match ProductGrid color
  },
  mrp: {
    fontSize: WINDOW_WIDTH < 380 ? 12 : 13,
    textDecorationLine: 'line-through',
    opacity: 0.5,
    color: colors.textSecondary,
  },
  discount: {
    fontSize: WINDOW_WIDTH < 380 ? 11 : 12,
    color: colors.success,
    fontWeight: '600',
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
  addToCartButton: {
    marginTop: SPACING * 0.75,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING,
    paddingHorizontal: SPACING * 1.5,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background, // Ensure background color matches theme
  },
  pageInfoText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
   errorFooter: { // Style for error message shown below list
     padding: SPACING,
     alignItems: 'center',
   },
  goToTopButton: { // Style for Go to Top button (same as index.tsx)
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
