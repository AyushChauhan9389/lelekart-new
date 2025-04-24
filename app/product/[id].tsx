import React, { useState, useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View, SafeAreaView, ActivityIndicator, Platform, Image, useWindowDimensions } from 'react-native'; // Added useWindowDimensions
import { useLocalSearchParams, router } from 'expo-router';
import Toast from 'react-native-toast-message'; // Import Toast
import RenderHTML from 'react-native-render-html'; // Import RenderHTML
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';
import { ImageCarousel } from '@/components/product/ImageCarousel';
import { Button } from '@/components/ui/Button';
import { ShoppingCart, LogIn, Heart } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { Product } from '@/types/api';
import { api } from '@/utils/api';

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [updatingWishlist, setUpdatingWishlist] = useState(false);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => createStyles(colors, colorScheme), [colors, colorScheme]);
  const { user, isLoading: isAuthLoading } = useAuth();
  const { width } = useWindowDimensions(); // Get window width

  useEffect(() => {
    const checkWishlist = async () => {
      if (user && product) {
        try {
          const { inWishlist } = await api.wishlist.checkItem(product.id);
          setIsInWishlist(inWishlist);
        } catch (error) {
          console.error('Failed to check wishlist status:', error);
        }
      }
    };
    checkWishlist();
  }, [user, product]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }
      try {
        const data = await api.products.getById(id);
        setProduct(data);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (isLoading || isAuthLoading) {
    return (
      <ThemedView style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  if (!product) {
    return (
      <ThemedView style={styles.centeredContainer}>
        <ThemedText>Product not found</ThemedText>
      </ThemedView>
    );
  }

  let productImages: string[] = [];
  try {
    if (product.images) {
      if (typeof product.images === 'string') {
        try {
          productImages = JSON.parse(product.images);
        } catch (error) {
          const cleanJson = product.images.replace(/^"/, '').replace(/"$/, '');
          const matches = cleanJson.match(/"([^"]+)"/g);
          if (matches) {
            productImages = matches.map(url => url.replace(/"/g, ''));
          } else if (product.images.includes('http')) {
            productImages = [product.images];
          }
        }
      } else if (Array.isArray(product.images)) {
        productImages = product.images;
      }
    }
  } catch (error) {
    console.error('Error handling images:', error);
    productImages = [];
  }

  const mainImage = product.imageUrl || product.image_url || productImages[0] || '';
  const validProductImages = productImages.filter(img => img && typeof img === 'string');

  const handleAddToCart = async () => {
    if (!product || addingToCart) return;
    setAddingToCart(true);
    try {
      await api.cart.addItem(product.id);
      Toast.show({
        type: 'success',
        text1: 'Added to Cart',
        text2: `${product.name} has been added to your cart.`,
        position: 'bottom',
      });
    } catch (error) {
      console.error('Failed to add to cart:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add item to cart.',
        position: 'bottom',
      });
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!product || updatingWishlist) return;
    setUpdatingWishlist(true);
    try {
      let message = '';
      if (isInWishlist) {
        await api.wishlist.removeItem(product.id);
        message = 'Removed from Wishlist';
      } else {
        await api.wishlist.addItem(product.id);
        message = 'Added to Wishlist';
      }
      setIsInWishlist(!isInWishlist);
      Toast.show({
        type: 'success',
        text1: message,
        position: 'bottom',
      });
    } catch (error) {
      console.error('Failed to update wishlist:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update wishlist.',
        position: 'bottom',
      });
    } finally {
      setUpdatingWishlist(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContentContainer}
      >
        <ImageCarousel images={[mainImage, ...validProductImages]} />
        <View style={styles.content}>
          <ThemedText type="title" style={styles.name}>
            {product.name}
          </ThemedText>

          <View style={styles.priceContainer}>
            <ThemedText type="title" style={styles.price}>
              ₹{product.price}
            </ThemedText>
            {product.mrp > product.price && (
              <View style={styles.discountContainer}>
                <ThemedText style={styles.mrp}>₹{product.mrp}</ThemedText>
                <ThemedText style={[styles.discount, { color: colors.success }]}>
                  {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF
                </ThemedText>
              </View>
            )}
          </View>

          {product.specifications && (
            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>Specifications</ThemedText>
              {/* Render HTML for specifications */}
              <RenderHTML
                contentWidth={width - 40} // Subtract padding
                source={{ html: product.specifications }}
                baseStyle={{ color: colors.text, opacity: colorScheme === 'dark' ? 0.7 : 0.8 }}
                tagsStyles={{ p: { marginVertical: 5, lineHeight: 22 }, li: { marginBottom: 8, lineHeight: 22 } }}
              />
            </View>
          )}

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Description</ThemedText>
             {/* Render HTML for description */}
             <RenderHTML
                contentWidth={width - 40} // Subtract padding
                source={{ html: product.description }}
                baseStyle={{ color: colors.text, opacity: colorScheme === 'dark' ? 0.7 : 0.8 }}
                tagsStyles={{ p: { marginVertical: 5, lineHeight: 22 }, li: { marginBottom: 8, lineHeight: 22 } }}
              />
          </View>

          {(product.color || product.size) && (
            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>Product Details</ThemedText>
              {product.color && (
                <ThemedText style={styles.sectionContent}>Color: {product.color}</ThemedText>
              )}
              {product.size && (
                <ThemedText style={styles.sectionContent}>Size: {product.size}</ThemedText>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.floatingButtonContainer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        {user ? (
          <View style={styles.buttonGroup}>
            <Button
              onPress={handleWishlistToggle}
              variant="outline"
              style={StyleSheet.flatten([styles.wishlistButton, { borderColor: colors.border }])} // Flatten styles
              disabled={updatingWishlist}
            >
              <Heart
                size={24}
                color={isInWishlist ? colors.primary : colors.textSecondary}
                fill={isInWishlist ? colors.primary : 'none'}
                strokeWidth={2}
              />
            </Button>
            <View style={styles.addToCartWrapper}>
              <Button
                onPress={handleAddToCart}
                disabled={addingToCart}
                leftIcon={<ShoppingCart size={20} color={colors.background} />}
              >
                {addingToCart ? 'Adding...' : 'Add to Cart'}
              </Button>
            </View>
          </View>
        ) : (
          <Button
            onPress={() => router.push('/(auth)/login')}
            fullWidth
            variant="secondary"
            leftIcon={<LogIn size={20} color={colors.background} />}
          >
            Login to Add to Cart
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: typeof Colors.light, colorScheme: 'light' | 'dark' | null) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
    },
    container: {
      flex: 1,
    },
    centeredContainer: { // Added for loading/error states
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollContentContainer: {
      paddingBottom: 100,
    },
    content: {
      padding: 20,
    },
    name: {
      fontSize: 26,
      marginBottom: 12,
    },
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 10,
      marginBottom: 20,
    },
    price: {
      fontSize: 30,
      fontWeight: 'bold',
    },
    discountContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 6,
    },
    mrp: {
      fontSize: 18,
      textDecorationLine: 'line-through',
      opacity: colorScheme === 'dark' ? 0.5 : 0.6,
    },
    discount: {
      fontSize: 16,
      fontWeight: '600',
    },
    section: {
      marginTop: 20,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 10,
    },
    sectionContent: {
      fontSize: 16,
      lineHeight: 24,
      opacity: colorScheme === 'dark' ? 0.7 : 0.8,
      // Remove fixed lineHeight if using RenderHTML
    },
    floatingButtonContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 16,
      paddingBottom: 24,
      borderTopWidth: 1,
      ...Platform.select({
        ios: {
          shadowColor: colorScheme === 'dark' ? colors.background : colors.text,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: colorScheme === 'dark' ? 0.3 : 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 5,
        },
      }),
    },
    buttonGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    wishlistButton: {
      width: 48,
      height: 48,
      padding: 0,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1.5,
      borderRadius: 8,
    },
    addToCartWrapper: {
      flex: 1,
    },
  });
