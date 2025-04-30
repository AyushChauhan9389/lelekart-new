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

interface CategoryProductGridProps {
  data: Product[];
  containerWidth: number;
}

// Dynamic column count based on container width
const getColumnCount = (width: number) => {
  if (width >= 800) return 3;  // Large panels
  if (width >= 500) return 2;  // Medium panels
  return 2; // Small panels
};

const SPACING = 8; // Reduced spacing

export function CategoryProductGrid({ data, containerWidth }: CategoryProductGridProps) {
  const [columns, setColumns] = React.useState(getColumnCount(containerWidth));
  // Account for doubled horizontal gap between items
  const totalGapWidth = SPACING * (columns - 1) * 2; // Double spacing between items
  const ITEM_WIDTH = (containerWidth - totalGapWidth - SPACING * 2) / columns; // Account for container padding

  React.useEffect(() => {
    setColumns(getColumnCount(containerWidth));
  }, [containerWidth]);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => createStyles(colors, ITEM_WIDTH, SPACING), [colors, ITEM_WIDTH]);
  const { user } = useAuth();

  const ProductGridItem = ({ item }: { item: Product }) => {
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
                  size={16}
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
              <ThemedText style={styles.price}>
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
              leftIcon={!addingToCart ? <ShoppingCart size={14} color={colors.background} /> : undefined}
            >
              {addingToCart 
                ? '...' 
                : ITEM_WIDTH < 130 
                  ? 'Add'
                  : ITEM_WIDTH < 160 
                    ? 'Add Cart'
                    : 'Add to Cart'
              }
            </Button>
          </View>
        </Pressable>
      </View>
    );
  };

  const renderItemCallback = useCallback(({ item }: { item: Product }) => (
    <ProductGridItem item={item} />
  ), []);

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={data}
        renderItem={renderItemCallback}
        keyExtractor={(item) => item.id.toString()}
        numColumns={columns}
        key={columns}
        scrollEnabled={true}
        contentContainerStyle={[
          styles.listContentContainer,
          { flexGrow: data.length > 0 ? 1 : 0 }
        ]}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={
          <ThemedText style={styles.emptyText}>No products found.</ThemedText>
        }
      />
    </ThemedView>
  );
}

const createStyles = (colors: typeof Colors.light, itemWidth: number, spacing: number) => StyleSheet.create({
  container: {
    padding: spacing,
  },
  listContentContainer: {
    paddingVertical: spacing,
  },
  columnWrapper: {
    gap: spacing * 2, // Double spacing between horizontal items
    justifyContent: 'flex-start',
  },
  itemOuterContainer: {
    width: itemWidth,
    marginBottom: spacing,
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
    width: 28,
    height: 28,
    borderRadius: 14,
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
    top: 4,
    right: 4,
  },
  content: {
    padding: spacing,
    backgroundColor: colors.card,
  },
  name: {
    fontSize: 12,
    lineHeight: 16,
    minHeight: 32,
    marginBottom: spacing / 2,
    opacity: 0.9,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing / 2,
    flexWrap: 'wrap',
    marginBottom: spacing / 2,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  mrp: {
    fontSize: 11,
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  discount: {
    fontSize: 10,
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
    marginTop: spacing / 2,
    height: 32,
  },
});
