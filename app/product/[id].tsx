import React, { useState, useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View, SafeAreaView, ActivityIndicator, Platform, useWindowDimensions, TouchableOpacity, Text } from 'react-native'; // Added TouchableOpacity, Text
import { useLocalSearchParams, router } from 'expo-router';
import Toast from 'react-native-toast-message';
import RenderHTML from 'react-native-render-html';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';
import { ImageCarousel } from '@/components/product/ImageCarousel';
import { Button } from '@/components/ui/Button';
import { ShoppingCart, LogIn, Heart, ArrowLeft, Star, Plus, Minus } from 'lucide-react-native'; // Added ArrowLeft, Star, Plus, Minus
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
  const [quantity, setQuantity] = useState(1); // Re-added quantity state
  const [selectedSize, setSelectedSize] = useState<string | null>(null); // Added size state
  const [selectedColor, setSelectedColor] = useState<string | null>(null); // Added color state

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
  // Ensure mainImage is not duplicated in the carousel list
  const carouselImages = [mainImage, ...validProductImages.filter(img => img !== mainImage)];


  const handleAddToCart = async () => {
    if (!product || addingToCart) return;
    setAddingToCart(true);
    try {
      await api.cart.addItem(product.id, quantity); // Pass quantity to API
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
    console.log('[Wishlist] Toggle triggered. Current state:', {
      productId: product?.id,
      updatingWishlist,
      isInWishlist,
      user: !!user, // Check if user object exists
    });

    if (!user) {
      console.log('[Wishlist] No user logged in. Redirecting to login.');
      router.push('/(auth)/login'); // Redirect if not logged in
      return;
    }

    if (!product || updatingWishlist) {
      console.log('[Wishlist] Aborting: No product or already updating.');
      return;
    }

    setUpdatingWishlist(true);
    console.log('[Wishlist] setUpdatingWishlist(true)');

    try {
      let message = '';
      let response; // Variable to hold API response
      if (isInWishlist) {
        console.log('[Wishlist] Attempting to remove item:', product.id);
        response = await api.wishlist.removeItem(product.id);
        console.log('[Wishlist] removeItem response:', response); // Log response
        message = 'Removed from Wishlist';
      } else {
        console.log('[Wishlist] Attempting to add item:', product.id);
        response = await api.wishlist.addItem(product.id);
        console.log('[Wishlist] addItem response:', response); // Log response
        message = 'Added to Wishlist';
      }
      setIsInWishlist(!isInWishlist);
      console.log('[Wishlist] setIsInWishlist ->', !isInWishlist);
      Toast.show({
        type: 'success',
        text1: message,
        position: 'bottom',
      });
      console.log('[Wishlist] Toast shown:', message);
    } catch (error) {
      console.error('[Wishlist] Failed to update wishlist:', error); // Log the full error
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update wishlist.',
        position: 'bottom',
      });
    } finally {
      setUpdatingWishlist(false);
      console.log('[Wishlist] setUpdatingWishlist(false)');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Carousel with Overlay Buttons */}
        <View style={styles.imageContainer}>
          <ImageCarousel images={carouselImages} /> {/* Use deduplicated images */}
          <TouchableOpacity
            style={[styles.overlayButton, styles.backButton]}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          {user && (
             <TouchableOpacity
               style={[styles.overlayButton, styles.wishlistButtonOverlay]}
               onPress={handleWishlistToggle}
               disabled={updatingWishlist}
             >
               <Heart
                 size={24}
                 color={isInWishlist ? colors.error : colors.text} // Use error color for filled heart
                 fill={isInWishlist ? colors.error : 'none'}
                 strokeWidth={2}
               />
             </TouchableOpacity>
           )}
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
                   {product.rating ?? 5.0} ({product.reviewCount ?? '7k+'} reviews) {/* Placeholder data */}
                 </ThemedText>
              </View>
           </View>

           {/* Price Row */}
           {/* Removed console log from here */}
           <View style={styles.priceRow}>
             <ThemedText type="subtitle" style={styles.price}>
               ₹{product.price}
             </ThemedText>
             {product.mrp > product.price && (
                <ThemedText style={styles.mrp}>₹{product.mrp}</ThemedText>
              )}
           </View>

           {/* Description */}
           <View style={styles.section}>
              {/* Use simple text for now, add "Read More" later if needed */}
              <ThemedText style={styles.descriptionText} numberOfLines={3}>
                 {/* Basic cleanup for potential HTML */}
                 {product.description.replace(/<[^>]*>/g, '')}
              </ThemedText>
              {/* TODO: Add "Read More..." functionality */}
           </View>

           {/* Size Selector */}
           {/* TODO: Replace with actual sizes from product data */}
           {product.availableSizes && product.availableSizes.length > 0 && (
             <View style={styles.section}>
               <ThemedText type="subtitle" style={styles.sectionTitle}>Choose Size</ThemedText>
               <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorScrollContainer}>
                 {product.availableSizes.map((size: string) => ( // Added type: string
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
           {/* TODO: Replace with actual colors from product data */}
           {product.availableColors && product.availableColors.length > 0 && (
             <View style={styles.section}>
               <ThemedText type="subtitle" style={styles.sectionTitle}>Color</ThemedText>
               <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorScrollContainer}>
                 {product.availableColors.map((color: string) => ( // Added type: string
                   <TouchableOpacity
                     key={color}
                     style={[
                       styles.colorSelectorButton,
                       selectedColor === color ? styles.colorSelectorButtonSelected : {},
                       { backgroundColor: color, borderColor: selectedColor === color ? colors.primary : colors.border } // Use actual color
                     ]}
                     onPress={() => setSelectedColor(color)}
                   />
                 ))}
               </ScrollView>
             </View>
            )}

            {/* Render specifications if available */}
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

        </View>
      </ScrollView>

      {/* Bottom Add to Cart Button */}
      <View style={styles.bottomButtonContainer}>
        {user ? (
          <View style={styles.loggedInBottomRow}>
            {/* Quantity Selector */}
            <View style={styles.bottomQuantitySelector}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus size={18} color={quantity <= 1 ? colors.textSecondary : colors.text} />
              </TouchableOpacity>
              <ThemedText style={styles.quantityText}>{quantity}</ThemedText>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(quantity + 1)}
              >
                <Plus size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
            {/* Add to Cart Button */}
            <View style={styles.addToCartButtonWrapper}>
              <Button
                onPress={handleAddToCart}
                style={styles.addToCartButton}
                disabled={addingToCart}
              >
                {/* Further Simplified Button Content */}
                <View style={styles.addToCartButtonContent}>
                  <Text style={styles.addToCartButtonText}>Add to Cart</Text>
                </View>
              </Button>
            </View>
          </View>
        ) : ( // Correct structure for logged-out state
          <Button
            onPress={() => router.push('/(auth)/login')}
            style={styles.addToCartButton} // Use same style for consistency
            leftIcon={<LogIn size={20} color={colors.background} />} // Use leftIcon prop
          >
            Login to Add {/* Direct text content, Button component should center it */}
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: typeof Colors.light, colorScheme: 'light' | 'dark' | null) => {
  const isDark = colorScheme === 'dark';
  return StyleSheet.create({
    safeArea: {
      flex: 1,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background, // Match details background for seamless scrolling area
    },
    centeredContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    scrollContentContainer: {
      paddingBottom: 90, // Adjust padding to allow space for floating bar without being excessive
    },
    // Image Section
    imageContainer: {
      // ImageCarousel likely handles its own height/aspect ratio
      position: 'relative', // Needed for absolute positioning of buttons
      backgroundColor: colors.border, // Placeholder background for image area
    },
    overlayButton: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 60 : 30, // Increased top margin to avoid status bar overlap
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.7)', // Semi-transparent white
      justifyContent: 'center',
      alignItems: 'center',
      // Add shadow/blur effect if possible/desired (can be complex in RN)
       ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 3,
          backgroundColor: colors.card, // Solid background fallback for Android
        },
      }),
    },
    backButton: {
      left: 15,
    },
    wishlistButtonOverlay: {
      right: 15,
    },
    // Details Section
    detailsContainer: {
      padding: 20,
      backgroundColor: colors.background, // White background as per Figma
      borderTopLeftRadius: 20, // Rounded corners for the details section
      borderTopRightRadius: 20,
      marginTop: -20, // Pulls the section up slightly over the image bottom
      zIndex: 1, // Ensure it sits above the image potentially
    },
    nameReviewRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start', // Align items to the top
      marginBottom: 15,
    },
    name: {
      flex: 1, // Allow name to take available space
      fontSize: 22, // Adjusted size
      fontWeight: '600', // Semi-bold
      marginRight: 10, // Space before reviews
      color: colors.text,
    },
    reviewContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card, // Slightly different background? Or none?
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    reviewText: {
      marginLeft: 5,
      fontSize: 12,
       color: colors.textSecondary,
     },
    // Price Row (Replaced Quantity Row)
    priceRow: {
      flexDirection: 'row',
      alignItems: 'baseline', // Align text nicely
      gap: 8, // Space between price and MRP
      marginBottom: 20,
    },
     price: { // Main price display
       fontSize: 24,
       fontWeight: 'bold',
       color: colors.text,
     },
     mrp: { // Strikethrough MRP
       fontSize: 16,
       textDecorationLine: 'line-through',
       color: colors.textSecondary,
       // No longer needed marginLeft as gap handles spacing
     },
    // Re-adding quantity styles for bottom placement
    quantityButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.border, // Button background
      justifyContent: 'center',
      alignItems: 'center',
    },
    quantityText: {
      fontSize: 16,
      fontWeight: '600',
      minWidth: 30, // Ensure some space for the number
      textAlign: 'center',
      color: colors.text,
      marginHorizontal: 8, // Space around the number
    },
     // Common Section Styles
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700', // Bold title
      marginBottom: 12,
      color: colors.text,
    },
    descriptionText: {
       fontSize: 14,
       lineHeight: 22,
       color: colors.textSecondary,
     },
    // Size/Color Selectors
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
    selectorButtonSelected: {
       // Handled inline backgroundColor/borderColor
    },
    selectorButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    selectorButtonTextSelected: {
       // Handled inline color
    },
    colorSelectorButton: {
       width: 36,
       height: 36,
       borderRadius: 18,
       borderWidth: 2,
     },
    colorSelectorButtonSelected: {
       // Handled inline borderColor
    },
    // Bottom Button Area
    bottomButtonContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 16,
      paddingBottom: Platform.OS === 'ios' ? 30 : 16, // Adjust for safe area bottom inset
      backgroundColor: colors.background, // Match details background
       borderTopWidth: 1,
       borderTopColor: colors.border,
       // Add shadow for better separation, similar to original floating style
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
    loggedInBottomRow: { // Container for quantity selector and button
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    bottomQuantitySelector: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 6,
    },
    addToCartButtonWrapper: {
      flex: 1, // Allow button to take remaining space
    },
    addToCartButton: {
       backgroundColor: colors.text,
       borderRadius: 30, // Highly rounded corners
       height: 60, // Fixed height
       paddingHorizontal: 10, // Reduce padding to let content spread
    },
     addToCartButtonContent: {
       // Removed flexDirection: 'row' as it's just text now
       alignItems: 'center', // Center vertically
       justifyContent: 'center', // Center horizontally
       width: '100%',
       height: '100%', // Ensure View takes full button height for centering
     },
     addToCartButtonText: { // Text style remains simple
       color: colors.background,
       fontSize: 16,
       fontWeight: '700',
     },
     // Removed unused styles: buttonCartIcon, buttonSeparatorText, buttonPriceText, buttonMrpTextInButton
  });
}; // Corrected closing brace
