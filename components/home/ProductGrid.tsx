import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Dimensions, Image, Pressable, StyleSheet, View, FlatList, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { storage } from '@/utils/storage';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Heart, ShoppingCart } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useCartUpdate } from '@/app/_layout'; // Import useCartUpdate from global layout
import { Button } from '@/components/ui/Button'; // Import Button
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { Product } from '@/types/api';
import { api } from '@/utils/api'; // Import api

interface ProductGridProps {
  data: Product[];
  // Removed containerWidth prop
}

const { width: WINDOW_WIDTH } = Dimensions.get('window');
// Dynamic column count based on screen width (original logic)
const getColumnCount = () => {
  if (WINDOW_WIDTH >= 1024) return 4; // Large tablets/desktop
  if (WINDOW_WIDTH >= 768) return 3;  // Tablets
  return 2; // Phones
};

const SPACING = 12;
const COLUMN_COUNT = getColumnCount();
// ITEM_WIDTH calculation based on WINDOW_WIDTH (original logic)
const ITEM_WIDTH = (WINDOW_WIDTH - SPACING * (COLUMN_COUNT + 1)) / COLUMN_COUNT;

export function ProductGrid({ data }: ProductGridProps) {
  const [columns, setColumns] = React.useState(COLUMN_COUNT);

  // Original dimension change listener
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
  // Generate styles dynamically based on colors (original signature)
  const styles = useMemo(() => createStyles(colors, colorScheme), [colors, colorScheme]);
  const { user } = useAuth(); // Get user auth state

  // -- Render Item Component with State and Handlers --
  const ProductGridItem = ({ item, styles, colors }: { item: Product, styles: any, colors: any }) => {
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [updatingWishlist, setUpdatingWishlist] = useState(false);
    const [addingToCart, setAddingToCart] = useState(false);
    const { triggerCartUpdate } = useCartUpdate(); // Get triggerCartUpdate

    // Check wishlist status (same logic)
    useEffect(() => {
      let isMounted = true;
      const checkStatus = async () => {
        setUpdatingWishlist(true);
        try {
          if (user) {
            const { inWishlist } = await api.wishlist.checkItem(item.id);
            if (isMounted) setIsInWishlist(inWishlist);
          } else if (item) {
            const items = await storage.wishlist.getItems();
            if (isMounted) {
              setIsInWishlist(items.some(wishlistItem => wishlistItem.productId === item.id));
            }
          }
        } catch (error) {
          if (isMounted && !(error instanceof Error && error.message.includes('404'))) {
            console.error(`Failed to check wishlist status for item ${item.id}:`, error);
          }
        } finally {
          if (isMounted) setUpdatingWishlist(false);
        }
      };
      checkStatus();
      return () => { isMounted = false; };
    }, [user, item]);

    // handleWishlistToggle (same logic)
    const handleWishlistToggle = async () => {
      if (!item || updatingWishlist) return;
      setUpdatingWishlist(true);
      try {
        let message = '';
        if (user) {
          if (isInWishlist) {
            await api.wishlist.removeItem(item.id);
            message = 'Removed from Wishlist';
          } else {
            await api.wishlist.addItem(item.id);
            message = 'Added to Wishlist';
          }
        } else {
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
        console.error('Failed to update wishlist:', error);
        Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to update wishlist.', position: 'bottom' });
      } finally {
        setUpdatingWishlist(false);
      }
    };

    // handleAddToCart (same logic)
    const handleAddToCart = async () => {
      if (!item || addingToCart) return;
      setAddingToCart(true);
      try {
        if (user) {
          await api.cart.addItem(item.id, 1);
        } else {
          await storage.cart.addItem(item, 1);
        }
        Toast.show({ type: 'success', text1: 'Added to Cart', text2: `${item.name} added.`, position: 'bottom' });
        triggerCartUpdate(); // Update cart badge
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
      <View style={styles.itemOuterContainer}>
        <Pressable
          style={[styles.item, { backgroundColor: colors.card }]}
          onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id.toString() } })}
        >
          <View style={styles.imageContainer}>
            <Image source={imageSource} style={styles.image} />
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
          <View style={styles.content}>
            <ThemedText numberOfLines={2} style={styles.name}>
            {item.name}
          </ThemedText>
          <View style={styles.priceContainer}>
            <ThemedText type="subtitle" style={styles.price}>
              ₹{item.price}
            </ThemedText>
            {showMrp && (
              <>
                <ThemedText style={styles.mrp}>₹{item.mrp.toString()}</ThemedText>
                <ThemedText style={styles.discount}>
                  {Math.round(((item.mrp - item.price) / item.mrp) * 100)}% off
                </ThemedText>
              </>
            )}
          </View>
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
      </View>
    );
  };
  // -- End Render Item Component --

  const renderItemCallback = useCallback(({ item }: { item: Product }) => (
    <ProductGridItem item={item} styles={styles} colors={colors} />
  ), [styles, colors]);

  return (
    // Remove ThemedView wrapper or remove padding from its style
    <FlatList
      style={styles.container} // Apply container style here if needed (e.g., background)
      data={data}
      renderItem={renderItemCallback}
      keyExtractor={(item) => item.id.toString()}
      numColumns={columns}
      key={columns}
      scrollEnabled={false} // Original setting
      contentContainerStyle={styles.listContentContainer} // Padding adjusted
      columnWrapperStyle={styles.columnWrapper} // Re-add columnWrapperStyle
        ListEmptyComponent={
          <ThemedText style={styles.emptyText}>No products found.</ThemedText>
        }
      />
  );
}

// Original StyleSheet creation function signature
const createStyles = (colors: typeof Colors.light, colorScheme: 'light' | 'dark' | null) => StyleSheet.create({
  container: {
    // Style for FlatList itself if needed (e.g., backgroundColor: colors.background)
    flex: 1, // Ensure FlatList takes available space if wrapped
  },
  listContentContainer: {
    paddingHorizontal: SPACING, // Restore outer padding
    paddingVertical: SPACING,
  },
  columnWrapper: {
    justifyContent: 'center', // Center the items in each row
    gap: SPACING, // Add consistent gap between items
  },
  itemOuterContainer: { // Original style using ITEM_WIDTH
    width: ITEM_WIDTH,
    marginBottom: SPACING, // Vertical spacing between rows
  },
  item: {
    flex: 1,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    resizeMode: 'contain',
    backgroundColor: '#f8f8f8',
  },
  overlayButton: {
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
  wishlistButton: {
    top: 6,
    right: 6,
  },
  cartButton: { // Original style
    bottom: 6,
    right: 6,
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
  },
  content: {
    padding: SPACING * 0.75, // Original padding
    backgroundColor: colors.card,
  },
  name: {
    fontSize: WINDOW_WIDTH < 380 ? 13 : 14, // Original font size check
    marginBottom: SPACING / 4,
    lineHeight: 20,
    minHeight: 40,
    opacity: 0.9,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING / 2,
    marginTop: SPACING / 4,
    flexWrap: 'wrap',
    marginBottom: SPACING * 0.5,
  },
  price: {
    fontSize: WINDOW_WIDTH < 380 ? 16 : 18, // Original font size check
    fontWeight: '700',
    color: colors.primary,
  },
  mrp: {
    fontSize: WINDOW_WIDTH < 380 ? 12 : 13, // Original font size check
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  discount: {
    fontSize: WINDOW_WIDTH < 380 ? 11 : 12, // Original font size check
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
    marginTop: SPACING * 0.75, // Original margin
  },
});
