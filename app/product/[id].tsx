  import React, { useState, useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View, SafeAreaView, ActivityIndicator, Platform, useWindowDimensions, TouchableOpacity, Text, Image, TextInput } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import Toast from 'react-native-toast-message';
import RenderHTML from 'react-native-render-html';
import { storage } from '@/utils/storage';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';
import { ImageCarousel } from '@/components/product/ImageCarousel';
import { Button } from '@/components/ui/Button';
import { ShoppingCart, LogIn, Heart, ArrowLeft, Star, Zap } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { Product, ProductVariant, StoredProduct } from '@/types/api';
import { api } from '@/utils/api';
import { RecommendationCard } from '@/components/product/RecommendationCard';

export default function ProductScreen() {
  // Route params
  const { id } = useLocalSearchParams<{ id: string }>();
  
  // Theme hooks
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => createStyles(colors, colorScheme), [colors, colorScheme]);
  const { width } = useWindowDimensions();
  
  // Auth context
  const { user, isLoading: isAuthLoading } = useAuth();
  
  // State
  const [product, setProduct] = useState<StoredProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [updatingWishlist, setUpdatingWishlist] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [uniqueColors, setUniqueColors] = useState<string[]>([]);
  const [uniqueSizes, setUniqueSizes] = useState<string[]>([]);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [pincode, setPincode] = useState('');
  const [deliveryDate, setDeliveryDate] = useState<string | null>(null);

  // Product fetching and variant processing
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }
      try {
        const data = await api.products.getById(id);
        setProduct(data);
        
        // Process variants
        if (data.variants && data.variants.length > 0) {
          // Extract unique colors and sizes from variants
          const colors = new Set<string>();
          const sizes = new Set<string>();
          
          data.variants.forEach((variant: ProductVariant) => {
            if (variant.color) {
              colors.add(variant.color);
            }
            if (variant.size) {
              variant.size.split(',').forEach((size: string) => {
                const trimmedSize = size.trim();
                if (trimmedSize) {
                  sizes.add(trimmedSize);
                }
              });
            }
          });
          
          setUniqueColors(Array.from(colors));
          setUniqueSizes(Array.from(sizes));
          
          // Set default variant if available
          setSelectedVariant(data.variants[0]);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Handle variant selection
  useEffect(() => {
    if (!product?.variants || !selectedColor || !selectedSize) return;

    const matchingVariant = product.variants.find(variant => 
      variant.color === selectedColor && 
      variant.size.split(',').map(s => s.trim()).includes(selectedSize)
    );

    if (matchingVariant) {
      setSelectedVariant(matchingVariant);
    }
  }, [selectedColor, selectedSize, product?.variants]);

  // Calculate delivery date (simple logic: current date + 5 days)
  useEffect(() => {
    const calculateDeliveryDate = () => {
      const today = new Date();
      const delivery = new Date(today);
      delivery.setDate(today.getDate() + 5);
      
      const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
      setDeliveryDate(delivery.toLocaleDateString('en-US', options));
    };
    
    // Calculate initially and whenever pincode changes (though logic is static here)
    calculateDeliveryDate();
  }, [pincode]); // Re-calculate if pincode changes, even if logic is static for now

  // Wishlist status check
  useEffect(() => {
    let isMounted = true;
    const checkWishlistStatus = async () => {
      if (!product) return;
      setUpdatingWishlist(true);
      try {
        if (user) {
          // Check server wishlist if logged in
          const { inWishlist } = await api.wishlist.checkItem(product.id);
          if (isMounted) setIsInWishlist(inWishlist);
        } else {
          // Check local storage if not logged in
          const items = await storage.wishlist.getItems();
          if (isMounted) {
            setIsInWishlist(items.some(item => item.productId === product.id));
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error('Failed to check wishlist status:', error);
        }
      } finally {
        if (isMounted) {
          setUpdatingWishlist(false);
        }
      }
    };

    checkWishlistStatus();
    return () => { isMounted = false; };
  }, [user, product]);

  // Fetch recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await fetch('https://lelekart.in/api/recommendations');
        const data = await response.json();
        setRecommendations(data);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      }
    };

    fetchRecommendations();
  }, []);

  // Image processing
  const { mainImage, carouselImages } = useMemo(() => {
    let productImages: string[] = [];
    try {
      if (product?.images) {
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

    const mainImage = product?.imageUrl || product?.image_url || productImages[0] || '';
    const validProductImages = productImages.filter(img => img && typeof img === 'string');
    return {
      mainImage,
      carouselImages: [mainImage, ...validProductImages.filter(img => img !== mainImage)]
    };
  }, [product]);

  // Action handlers
  const handleAddToCart = async () => {
    if (!product || addingToCart || !selectedVariant) return;
    setAddingToCart(true);
    try {
      if (user) {
        // TODO: Update API to handle variant ID
        await api.cart.addItem(product.id, 1);
      } else {
        // TODO: Update storage to handle variant
        await storage.cart.addItem(product, 1);
      }
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

  const handleBuyNow = async () => {
    if (!product || !selectedVariant) return;
    if (!user) {
      router.push('/(auth)/login');
      return;
    }

    try {
      // TODO: Update API to handle variant ID
      await api.cart.addItem(product.id, 1);
      router.push('/checkout');
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add item to cart.',
        position: 'bottom',
      });
    }
  };

  const handleWishlistToggle = async () => {
    if (!product || updatingWishlist) return;
    
    setUpdatingWishlist(true);
    try {
      let message = '';
      if (user) {
        if (isInWishlist) {
          await api.wishlist.removeItem(product.id);
          message = 'Removed from Wishlist';
        } else {
          await api.wishlist.addItem(product.id);
          message = 'Added to Wishlist';
        }
      } else {
        if (isInWishlist) {
          await storage.wishlist.removeItem(product.id);
          message = 'Removed from Wishlist';
        } else {
          await storage.wishlist.addItem(product);
          message = 'Added to Wishlist';
        }
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

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Carousel with Overlay Buttons */}
        <View style={styles.imageContainer}>
          <ImageCarousel images={carouselImages} />
          <TouchableOpacity
            style={[styles.overlayButton, styles.backButton]}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.overlayButton, styles.wishlistButtonOverlay]}
            onPress={handleWishlistToggle}
            disabled={updatingWishlist}
          >
            <Heart
              size={24}
              color={isInWishlist ? colors.error : colors.text}
              fill={isInWishlist ? colors.error : 'none'}
              strokeWidth={2}
            />
          </TouchableOpacity>
        </View>

        {/* Product Details Section */}
        <View style={styles.detailsContainer}>
           {/* Name and Reviews Row */}
           <View style={styles.nameReviewRow}>
              <ThemedText type="title" style={styles.name}>
                 {product.name}
              </ThemedText>
              <View style={styles.reviewContainer}>
                 <Star size={16} color={colors.warning} fill={colors.warning} />
                 <ThemedText style={styles.reviewText}>
                   {product.rating ?? 5.0} ({product.reviewCount ?? '7k+'} reviews)
                 </ThemedText>
              </View>
           </View>

           {/* Price Row */}
           <View style={styles.priceRow}>
             <ThemedText type="subtitle" style={styles.price}>
               ₹{selectedVariant?.price || product.price}
             </ThemedText>
             {(selectedVariant?.mrp || product.mrp) > (selectedVariant?.price || product.price) && (
                <ThemedText style={styles.mrp}>₹{selectedVariant?.mrp || product.mrp}</ThemedText>
             )}
           </View>

           {/* Description */}
           <View style={styles.section}>
              <ThemedText style={styles.descriptionText} numberOfLines={3}>
                 {product.description.replace(/<[^>]*>/g, '')}
              </ThemedText>
           </View>

           {/* Size Selector */}
           {uniqueSizes.length > 0 && (
             <View style={styles.section}>
               <ThemedText type="subtitle" style={styles.sectionTitle}>Choose Size</ThemedText>
               <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorScrollContainer}>
                 {uniqueSizes.map((size: string) => (
                   <TouchableOpacity
                     key={size}
                     style={[
                       styles.selectorButton,
                       selectedSize === size ? styles.selectorButtonSelected : {},
                       { borderColor: colors.border, backgroundColor: selectedSize === size ? colors.text : colors.background }
                     ]}
                     onPress={() => setSelectedSize(size)}
                   >
                     <ThemedText style={[
                       styles.selectorButtonText,
                       selectedSize === size ? styles.selectorButtonTextSelected : {},
                       { color: selectedSize === size ? colors.background : colors.text }
                     ]}>{size}</ThemedText>
                   </TouchableOpacity>
                 ))}
               </ScrollView>
             </View>
           )}

           {/* Color Selector */}
           {uniqueColors.length > 0 && (
             <View style={styles.section}>
               <ThemedText type="subtitle" style={styles.sectionTitle}>Color</ThemedText>
               <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorScrollContainer}>
                 {uniqueColors.map((size: string) => (
                   <TouchableOpacity
                     key={size}
                     style={[
                       styles.selectorButton,
                       selectedSize === size ? styles.selectorButtonSelected : {},
                       { borderColor: colors.border, backgroundColor: selectedSize === size ? colors.text : colors.background }
                     ]}
                     onPress={() => setSelectedSize(size)}
                   >
                     <ThemedText style={[
                       styles.selectorButtonText,
                       selectedSize === size ? styles.selectorButtonTextSelected : {},
                       { color: selectedSize === size ? colors.background : colors.text }
                     ]}>{size}</ThemedText>
                   </TouchableOpacity>
                 ))}
               </ScrollView>
             </View>
            )}

           {/* Variant Details */}
           {selectedVariant && (
             <View style={styles.section}>
               <View style={[styles.variantDetails, { backgroundColor: colors.card }]}>
                 <ThemedText style={[styles.variantText, { color: colors.textSecondary }]}>
                   Stock: {selectedVariant.stock} units
                 </ThemedText>
                 <ThemedText style={[styles.variantText, { color: colors.textSecondary }]}>
                   SKU: {selectedVariant.sku}
                 </ThemedText>
               </View>
             </View>
           )}

            {/* Specifications */}
            {product.specifications && (
              <View style={styles.section}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>Specifications</ThemedText>
                <RenderHTML
                  contentWidth={width - 40}
                  source={{ html: product.specifications }}
                  baseStyle={{ color: colors.text, opacity: colorScheme === 'dark' ? 0.7 : 0.8 }}
                  tagsStyles={{ p: { marginVertical: 5, lineHeight: 22 }, li: { marginBottom: 8, lineHeight: 22 } }}
                />
              </View>
             )}

            {/* Pincode / Delivery Section */}
            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>Check Delivery</ThemedText>
              <View style={styles.pincodeContainer}>
                <TextInput
                  style={[styles.pincodeInput, { borderColor: colors.border, color: colors.text }]}
                  placeholder="Enter Pincode"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  maxLength={6}
                  value={pincode}
                  onChangeText={setPincode}
                />
                <Button 
                  size="sm" 
                  style={styles.pincodeButton}
                  disabled={pincode.length !== 6} // Basic validation
                  onPress={() => { /* Trigger recalculation or API call if needed */ }}
                >
                  Check
                </Button>
              </View>
              {deliveryDate && pincode.length === 6 && (
                <ThemedText style={[styles.deliveryText, { color: colors.success }]}>
                  Estimated delivery by {deliveryDate}
                </ThemedText>
              )}
               {pincode.length > 0 && pincode.length < 6 && (
                 <ThemedText style={[styles.deliveryText, { color: colors.error }]}>
                   Enter a valid 6-digit pincode
                 </ThemedText>
               )}
            </View>

            {/* Recommendations Section */}
            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>Recommended Products</ThemedText>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recommendationsContainer}
              >
                {recommendations.length === 0 ? (
                  <View style={styles.recommendationsLoading}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : (
                  recommendations.map((item) => (
                    <RecommendationCard
                      key={item.id}
                      item={item}
                      colors={colors}
                      currentId={id}
                    />
                  ))
                )}
              </ScrollView>
            </View>
        </View>
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomButtonContainer}>
        <View style={styles.loggedInBottomRow}>
          <View style={styles.buttonWrapper}>
            <Button
              onPress={handleAddToCart}
              style={styles.cartButton}
              variant="outline"
              disabled={addingToCart || !selectedVariant}
              textStyle={{ color: colors.text }}
              leftIcon={<ShoppingCart size={20} color={colors.text} />}
            >
              Cart
            </Button>
          </View>
          <View style={styles.buttonWrapper}>
            {user ? (
              <Button
                onPress={handleBuyNow}
                style={styles.buyButton}
                disabled={!selectedVariant}
                leftIcon={<Zap size={20} color={colors.background} />}
              >
                Buy Now
              </Button>
            ) : (
              <Button
                onPress={() => router.push('/(auth)/login')}
                style={styles.buyButton}
                leftIcon={<LogIn size={20} color={colors.background} />}
              >
                Login to Buy
              </Button>
            )}
          </View>
        </View>
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
      backgroundColor: colors.background,
    },
    centeredContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    scrollContentContainer: {
      paddingBottom: 90,
    },
    imageContainer: {
      position: 'relative',
      backgroundColor: colors.border,
    },
    overlayButton: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 60 : 30,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 3,
          backgroundColor: colors.card,
        },
      }),
    },
    backButton: {
      left: 15,
    },
    wishlistButtonOverlay: {
      right: 15,
    },
    detailsContainer: {
      padding: 20,
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      marginTop: -20,
      zIndex: 1,
    },
    nameReviewRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 15,
    },
    name: {
      flex: 1,
      fontSize: 22,
      fontWeight: '600',
      marginRight: 10,
      color: colors.text,
    },
    reviewContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    reviewText: {
      marginLeft: 5,
      fontSize: 12,
      color: colors.textSecondary,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 8,
      marginBottom: 20,
    },
    price: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
    },
    mrp: {
      fontSize: 16,
      textDecorationLine: 'line-through',
      color: colors.textSecondary,
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 12,
      color: colors.text,
    },
    descriptionText: {
      fontSize: 14,
      lineHeight: 22,
      color: colors.textSecondary,
    },
    selectorScrollContainer: {
      gap: 10,
    },
    selectorButton: {
      minWidth: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 15,
    },
    selectorButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    selectorButtonSelected: {
      backgroundColor: colors.text,
      borderColor: colors.text,
    },
    selectorButtonTextSelected: {
      color: colors.background,
    },
    colorSelectorButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 2,
    },
    colorSelectorButtonSelected: {
      borderColor: colors.primary,
      borderWidth: 3,
    },
    variantDetails: {
      padding: 12,
      borderRadius: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    variantText: {
      fontSize: 14,
    },
    bottomButtonContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 16,
      paddingBottom: Platform.OS === 'ios' ? 30 : 16,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 5,
        },
      }),
    },
    loggedInBottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    buttonWrapper: {
      flex: 1,
    },
    cartButton: {
      borderRadius: 30,
      height: 50,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: colors.text,
      backgroundColor: colors.background,
    },
    buyButton: {
      borderRadius: 30,
      height: 50,
      paddingHorizontal: 10,
      backgroundColor: colors.text,
    },
    recommendationsContainer: {
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    recommendationsLoading: {
      height: 200,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    pincodeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 10,
    },
    pincodeInput: {
      flex: 1,
      height: 44,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      fontSize: 16,
    },
    pincodeButton: {
      height: 44,
      paddingHorizontal: 15,
    },
    deliveryText: {
      marginTop: 8,
      fontSize: 14,
      fontWeight: '500',
    },
  });
