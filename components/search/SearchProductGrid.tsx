import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Dimensions, Image, Pressable, StyleSheet, View, FlatList, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { storage } from '@/utils/storage';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Heart, ShoppingCart } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { Product } from '@/types/api';
import { api } from '@/utils/api';

// Interface specifically for SearchProductGrid
interface SearchProductGridProps {
  data: Product[];
  containerWidth: number; // containerWidth is required here
}

const { width: WINDOW_WIDTH } = Dimensions.get('window');

// Dynamic column count based on available width
const getColumnCount = (width: number) => {
  if (width >= 1024) return 4;
  if (width >= 768) return 3;
  return 2;
};

const SPACING = 12; // Use the original spacing for search results

// Renamed component
export function SearchProductGrid({ data, containerWidth }: SearchProductGridProps) {
  const effectiveWidth = containerWidth; // Use the passed containerWidth directly

  const [columns, setColumns] = React.useState(getColumnCount(effectiveWidth));

  React.useEffect(() => {
    setColumns(getColumnCount(effectiveWidth));
  }, [effectiveWidth]);

  const ITEM_WIDTH = (effectiveWidth - SPACING * (columns + 1)) / columns;

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => createStyles(colors, colorScheme, ITEM_WIDTH, SPACING, effectiveWidth), [colors, colorScheme, ITEM_WIDTH, effectiveWidth]);
  const { user } = useAuth();

  const ProductGridItem = ({ item, styles, colors }: { item: Product, styles: any, colors: any }) => {
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [updatingWishlist, setUpdatingWishlist] = useState(false);
    const [addingToCart, setAddingToCart] = useState(false);

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

  const renderItemCallback = useCallback(({ item }: { item: Product }) => (
    <ProductGridItem item={item} styles={styles} colors={colors} />
  ), [styles, colors]);

  return (
    // Use FlatList directly for scrollable grid
    <FlatList
      data={data}
      renderItem={renderItemCallback}
      keyExtractor={(item) => item.id.toString()}
      numColumns={columns}
      key={columns}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContentContainer}
      columnWrapperStyle={styles.columnWrapper}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>No products found.</ThemedText>
        </View>
      }
    />
  );
}

const createStyles = (colors: typeof Colors.light, colorScheme: 'light' | 'dark' | null, itemWidth: number, spacing: number, effectiveWidth: number) => StyleSheet.create({
  listContentContainer: {
    padding: spacing, // Add padding here
    paddingBottom: 100, // Ensure space at bottom
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: spacing,
  },
  itemOuterContainer: {
    width: itemWidth,
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
  cartButton: {
    bottom: 6,
    right: 6,
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
  },
  content: {
    padding: spacing * 0.75,
    backgroundColor: colors.card,
  },
  name: {
    fontSize: effectiveWidth < 380 ? 13 : 14,
    marginBottom: spacing / 4,
    lineHeight: 20,
    minHeight: 40,
    opacity: 0.9,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing / 2,
    marginTop: spacing / 4,
    flexWrap: 'wrap',
    marginBottom: spacing * 0.5,
  },
  price: {
    fontSize: effectiveWidth < 380 ? 16 : 18,
    fontWeight: '700',
    color: colors.primary,
  },
  mrp: {
    fontSize: effectiveWidth < 380 ? 12 : 13,
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  discount: {
    fontSize: effectiveWidth < 380 ? 11 : 12,
    color: colors.success,
    fontWeight: '600',
  },
  emptyContainer: { // Style for empty state
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    opacity: 0.7,
  },
  addToCartButton: {
    marginTop: spacing * 0.75,
  },
});
