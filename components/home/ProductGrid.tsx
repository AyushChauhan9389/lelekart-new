import React, { useState, useEffect, useMemo, useCallback } from 'react'; // Import useState, useEffect, useMemo, useCallback
import { Dimensions, Image, Pressable, StyleSheet, View, FlatList, Platform, TouchableOpacity, ActivityIndicator } from 'react-native'; // Import TouchableOpacity, ActivityIndicator
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Heart, ShoppingCart } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button'; // Import Button
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { Product } from '@/types/api';
import { api } from '@/utils/api'; // Import api

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
  const styles = useMemo(() => createStyles(colors, colorScheme), [colors, colorScheme]);
  const { user } = useAuth(); // Get user auth state

  // -- Render Item Component with State and Handlers --
  // Moved render logic into a separate component to manage state correctly per item
  const ProductGridItem = ({ item, styles, colors }: { item: Product, styles: any, colors: any }) => {
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [updatingWishlist, setUpdatingWishlist] = useState(false);
    const [addingToCart, setAddingToCart] = useState(false);

    // Check wishlist status when user or item changes
    useEffect(() => {
      let isMounted = true;
      const checkStatus = async () => {
        if (user && item) {
          setUpdatingWishlist(true); // Show loading indicator while checking
          try {
            const { inWishlist } = await api.wishlist.checkItem(item.id);
            if (isMounted) setIsInWishlist(inWishlist);
          } catch (error) {
             if (isMounted && !(error instanceof Error && error.message.includes('404'))) {
                console.error(`Failed to check wishlist status for item ${item.id}:`, error);
             }
          } finally {
             if (isMounted) setUpdatingWishlist(false);
          }
        } else {
          if (isMounted) setIsInWishlist(false);
        }
      };
      checkStatus();
      return () => { isMounted = false; };
    }, [user, item]);

    const handleWishlistToggle = async () => {
      if (!user) { router.push('/(auth)/login'); return; }
      if (updatingWishlist || !item) return;
      setUpdatingWishlist(true);
      try {
        let message = '';
        if (isInWishlist) {
          await api.wishlist.removeItem(item.id);
          message = 'Removed from Wishlist';
        } else {
          await api.wishlist.addItem(item.id);
          message = 'Added to Wishlist';
        }
        setIsInWishlist(!isInWishlist);
        Toast.show({ type: 'success', text1: message, position: 'bottom' });
      } catch (error) {
        console.error('Failed to update wishlist:', error);
        Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to update wishlist.', position: 'bottom' });
      } finally {
        setUpdatingWishlist(false);
      }
    };

    const handleAddToCart = async () => {
      if (!user) { router.push('/(auth)/login'); return; }
      if (addingToCart || !item) return;
      setAddingToCart(true);
      try {
        await api.cart.addItem(item.id, 1); // Add quantity 1
        Toast.show({ type: 'success', text1: 'Added to Cart', text2: `${item.name} added.`, position: 'bottom' });
      } catch (error) {
        console.error('Failed to add to cart:', error);
        Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to add item to cart.', position: 'bottom' });
      } finally {
        setAddingToCart(false);
      }
    };

    const imageSource = { uri: item.image_url || 'https://lelekart.in/images/electronics.svg' };
    const showMrp = item.mrp !== null && item.mrp > item.price;

    return (
      // Outer container for spacing
      <View style={styles.itemOuterContainer}>
        {/* Main Pressable Card */}
        <Pressable
          style={[styles.item, { backgroundColor: colors.card }]}
          onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id.toString() } })}
        >
          {/* Image Container for Overlays */}
          <View style={styles.imageContainer}>
            <Image source={imageSource} style={styles.image} />
            {/* Wishlist Button Overlay */}
            {user && ( // Only show if user is logged in
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
            )}
            {/* Add to Cart Button Overlay Removed */}
          </View>
          {/* Content Below Image */}
          <View style={styles.content}>
            <ThemedText numberOfLines={2} style={styles.name}>
            {item.name}
          </ThemedText>
          <View style={styles.priceContainer}>
            <ThemedText type="subtitle" style={styles.price}>
              ₹{item.price}
            </ThemedText>
            {/* Use the refined condition */}
            {showMrp && (
              <>
                {/* Restore original MRP display (just value) */}
                <ThemedText style={styles.mrp}>₹{item.mrp.toString()}</ThemedText>
                {/* Restore discount display */}
                <ThemedText style={styles.discount}>
                  {Math.round(((item.mrp - item.price) / item.mrp) * 100)}% off
                </ThemedText>
              </>
            )}
          </View>
          {/* Add to Cart Button Below Content */}
          {user && (
            <Button
              onPress={handleAddToCart}
              disabled={addingToCart}
              style={styles.addToCartButton}
              size="sm"
              leftIcon={!addingToCart ? <ShoppingCart size={16} color={colors.background} /> : undefined} // Add icon
            >
              {addingToCart ? 'Adding...' : 'Add to Cart'}
            </Button>
          )}
        </View>
        </Pressable>
      </View>
    );
  };
  // -- End Render Item Component --


  // Updated to use the ProductGridItem component
  const renderItemCallback = useCallback(({ item }: { item: Product }) => (
    <ProductGridItem item={item} styles={styles} colors={colors} />
  ), [styles, colors]); // Depend on styles and colors

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={data}
        renderItem={renderItemCallback} // Use the memoized callback
        keyExtractor={(item) => item.id.toString()}
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
    // Empty for now as padding is handled by container
  },
  columnWrapper: {
    // Removed justifyContent, using padding on outer container now
    // marginBottom: SPACING, // Spacing handled by itemOuterContainer padding
  },
  itemOuterContainer: { // Added outer container for spacing
    width: ITEM_WIDTH,
    padding: SPACING / 2,
  },
  item: {
    flex: 1, // Occupy space within outer container
    // Removed margin
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  imageContainer: { // Container for image and overlay buttons
    position: 'relative',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    resizeMode: 'contain',
    backgroundColor: '#f8f8f8',
  },
  overlayButton: { // Common style for overlay buttons
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.85)', // Slightly less transparent
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  wishlistButton: { // Position top-right
    top: 6,
    right: 6,
  },
  cartButton: { // Position bottom-right
    bottom: 6,
    right: 6,
    // Optional: slightly different background/border for cart
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
  },
  content: {
    padding: SPACING * 0.75, // Use SPACING
    backgroundColor: colors.card,
  },
  name: {
    fontSize: WINDOW_WIDTH < 380 ? 13 : 14,
    marginBottom: SPACING / 4, // Reduced bottom margin
    lineHeight: 20,
    minHeight: 40, // Keep minHeight to maintain alignment
    opacity: 0.9,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline', // Changed back to baseline for better text alignment
    gap: SPACING / 2,
    marginTop: SPACING / 4, // Reduced top margin
    flexWrap: 'wrap',
    marginBottom: SPACING * 0.5,
  },
  price: {
    fontSize: WINDOW_WIDTH < 380 ? 16 : 18,
    fontWeight: '700',
    color: colors.primary,
  },
  // Removed mrpTempDebug style
  mrp: { // Restore original style
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
  addToCartButton: {
    marginTop: SPACING * 0.75, // Use SPACING
  },
});
