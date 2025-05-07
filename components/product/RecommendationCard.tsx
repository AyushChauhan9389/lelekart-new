import React, { useState, useEffect } from 'react';
import { Image, Pressable, StyleSheet, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { storage } from '@/utils/storage';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { ThemedText } from '@/components/ThemedText';
import { Heart, ShoppingCart } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useCartUpdate } from '@/app/_layout'; // Import useCartUpdate from global layout
import { Button } from '@/components/ui/Button';
import Colors from '@/constants/Colors';
import type { Product } from '@/types/api';
import { api } from '@/utils/api';

interface RecommendationCardProps {
  item: Product;
  colors: typeof Colors.light;
  currentId: string;
}

export function RecommendationCard({ item, colors, currentId }: RecommendationCardProps) {
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [updatingWishlist, setUpdatingWishlist] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const { user } = useAuth();
  const { triggerCartUpdate } = useCartUpdate(); // Get triggerCartUpdate

  // Check wishlist status
  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      setUpdatingWishlist(true);
      try {
        if (user) {
          const { inWishlist } = await api.wishlist.checkItem(item.id);
          if (isMounted) setIsInWishlist(inWishlist);
        } else {
          const items = await storage.wishlist.getItems();
          if (isMounted) {
            setIsInWishlist(items.some(wishlistItem => wishlistItem.productId === item.id));
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error(`Failed to check wishlist status:`, error);
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
      triggerCartUpdate(); // Update cart badge
    } catch (error) {
      console.error('Failed to add to cart:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to add item to cart.', position: 'bottom' });
    } finally {
      setAddingToCart(false);
    }
  };

  const imageSource = { uri: item.imageUrl || item.image_url };
  const showMrp = item.mrp !== null && item.mrp > item.price;

  return (
    <Pressable
      style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => {
        if (item.id.toString() !== currentId) {
          router.push(`/product/${item.id}`);
        }
      }}
    >
      {/* Image Container */}
      <View style={styles.imageContainer}>
        <Image source={imageSource} style={styles.image} resizeMode="contain" />
        {/* Wishlist Button */}
        <TouchableOpacity
          style={[styles.overlayButton, styles.wishlistButton, { backgroundColor: 'rgba(255, 255, 255, 0.85)' }]}
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
      <View style={[styles.content, { backgroundColor: colors.card }]}>
        <ThemedText numberOfLines={2} style={[styles.name, { color: colors.text }]}>
          {item.name}
        </ThemedText>
        <View style={styles.priceContainer}>
          <ThemedText style={[styles.price, { color: colors.primary }]}>
            ₹{item.price}
          </ThemedText>
          {showMrp && (
            <>
              <ThemedText style={[styles.mrp, { color: colors.textSecondary }]}>₹{item.mrp}</ThemedText>
              <ThemedText style={[styles.discount, { color: colors.success }]}>
                {Math.round(((item.mrp - item.price) / item.mrp) * 100)}% off
              </ThemedText>
            </>
          )}
        </View>
        <Button
          onPress={handleAddToCart}
          disabled={addingToCart}
          style={{ ...styles.addToCartButton, backgroundColor: colors.text }}
          size="sm"
          leftIcon={!addingToCart ? <ShoppingCart size={16} color={colors.background} /> : undefined}
          textStyle={{ color: colors.background }}
        >
          {addingToCart ? 'Adding...' : 'Add to Cart'}
        </Button>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    width: 170,
    marginRight: 12,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f8f8f8',
  },
  overlayButton: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wishlistButton: {
    top: 6,
    right: 6,
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 13,
    marginBottom: 3,
    lineHeight: 20,
    minHeight: 40,
    opacity: 0.9,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
  },
  mrp: {
    fontSize: 12,
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  discount: {
    fontSize: 11,
    fontWeight: '600',
  },
  addToCartButton: {
    marginTop: 4,
  },
});
