import React, { useState, useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View, SafeAreaView, ActivityIndicator, Platform, useWindowDimensions, TouchableOpacity, Text, Image, TextInput, FlatList } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { useLocalSearchParams, router } from 'expo-router';
import Toast from 'react-native-toast-message';
import RenderHTML from 'react-native-render-html';
import { storage } from '@/utils/storage';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';
import { ImageCarousel } from '@/components/product/ImageCarousel';
import { LoadingButton } from '@/components/ui/LoadingButton'; // Use LoadingButton
import { ReviewModal } from '@/components/product/ReviewModal';
import { ShoppingCart, LogIn, Heart, ArrowLeft, Star, Zap, MessageCircle } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { Product, ProductVariant, StoredProduct, ProductRatingResponse, Review, CreateReviewPayload } from '@/types/api'; // Import Review types
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
  const [ratingData, setRatingData] = useState<ProductRatingResponse | null>(null);
  const [isLoadingRating, setIsLoadingRating] = useState(true);
  // New state for reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [hasUserReviewed, setHasUserReviewed] = useState(false);

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
          const colors = new Set<string>();
          const sizes = new Set<string>();
          data.variants.forEach((variant: ProductVariant) => {
            if (variant.color) colors.add(variant.color);
            if (variant.size) variant.size.split(',').forEach((size: string) => {
              const trimmedSize = size.trim();
              if (trimmedSize) sizes.add(trimmedSize);
            });
          });
          const firstVariant = data.variants[0];
          const firstSize = firstVariant.size?.split(',')[0]?.trim() || null; // Get first size safely

          setUniqueColors(Array.from(colors));
          setUniqueSizes(Array.from(sizes));
          // Set default selections based on the first variant
          setSelectedVariant(firstVariant);
          setSelectedColor(firstVariant.color || null); // Handle potential missing color
          setSelectedSize(firstSize); // Set the first size
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // Fetch rating data
  useEffect(() => {
    const fetchRating = async () => {
      if (!id) {
        setIsLoadingRating(false);
        return;
      }
      setIsLoadingRating(true);
      try {
        const data = await api.products.getRating(id);
        setRatingData(data);
      } catch (error) {
        console.error('Error fetching product rating:', error);
        setRatingData(null);
      } finally {
        setIsLoadingRating(false);
      }
    };
    fetchRating();
  }, [id]);

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;
      setIsLoadingReviews(true);
      try {
        const data = await api.products.getReviews(id);
        setReviews(data);
        if (user) {
          setHasUserReviewed(data.some(review => review.userId === user.id));
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setIsLoadingReviews(false);
      }
    };
    fetchReviews();
  }, [id, user]);

  // Handle variant selection
  useEffect(() => {
    if (!product?.variants || !selectedColor || !selectedSize) return;
    const matchingVariant = product.variants.find(variant =>
      variant.color === selectedColor &&
      variant.size.split(',').map(s => s.trim()).includes(selectedSize)
    );
    if (matchingVariant) setSelectedVariant(matchingVariant);
  }, [selectedColor, selectedSize, product?.variants]);

  // Calculate delivery date
  useEffect(() => {
    const calculateDeliveryDate = () => {
      const today = new Date();
      const delivery = new Date(today);
      delivery.setDate(today.getDate() + 5);
      const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
      setDeliveryDate(delivery.toLocaleDateString('en-US', options));
    };
    calculateDeliveryDate();
  }, [pincode]);

  // Wishlist status check
  useEffect(() => {
    let isMounted = true;
    const checkWishlistStatus = async () => {
      if (!product) return;
      setUpdatingWishlist(true);
      try {
        if (user) {
          const { inWishlist } = await api.wishlist.checkItem(product.id);
          if (isMounted) setIsInWishlist(inWishlist);
        } else {
          const items = await storage.wishlist.getItems();
          if (isMounted) setIsInWishlist(items.some(item => item.productId === product.id));
        }
      } catch (error) {
        if (isMounted) console.error('Failed to check wishlist status:', error);
      } finally {
        if (isMounted) setUpdatingWishlist(false);
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
          try { productImages = JSON.parse(product.images); }
          catch (error) {
            const cleanJson = product.images.replace(/^"/, '').replace(/"$/, '');
            const matches = cleanJson.match(/"([^"]+)"/g);
            if (matches) productImages = matches.map(url => url.replace(/"/g, ''));
            else if (product.images.includes('http')) productImages = [product.images];
          }
        } else if (Array.isArray(product.images)) productImages = product.images;
      }
    } catch (error) {
      console.error('Error handling images:', error);
      productImages = [];
    }
    const mainImg = product?.imageUrl || product?.image_url || productImages[0] || '';
    const validProductImages = productImages.filter(img => img && typeof img === 'string');
    return { mainImage: mainImg, carouselImages: [mainImg, ...validProductImages.filter(img => img !== mainImg)] };
  }, [product]);

  // Action handlers
  const handleAddToCart = async () => {
    if (!product || addingToCart) return;
    if (product.variants && product.variants.length > 0 && !selectedVariant) return;
    setAddingToCart(true);
    try {
      if (user) await api.cart.addItem(product.id, 1);
      else await storage.cart.addItem(product, 1);
      Toast.show({ type: 'success', text1: 'Added to Cart', text2: `${product.name} added.`, position: 'bottom' });
    } catch (error) {
      console.error('Failed to add to cart:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to add item to cart.', position: 'bottom' });
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    if (product.variants && product.variants.length > 0 && !selectedVariant) return;
    if (!user) { router.push('/(auth)/login'); return; }
    try {
      await api.cart.addItem(product.id, 1);
      router.push('/checkout');
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to add item to cart.', position: 'bottom' });
    }
  };

  const handleWishlistToggle = async () => {
    if (!product || updatingWishlist) return;
    setUpdatingWishlist(true);
    try {
      let message = '';
      if (user) {
        if (isInWishlist) { await api.wishlist.removeItem(product.id); message = 'Removed from Wishlist'; }
        else { await api.wishlist.addItem(product.id); message = 'Added to Wishlist'; }
      } else {
        if (isInWishlist) { await storage.wishlist.removeItem(product.id); message = 'Removed from Wishlist'; }
        else { await storage.wishlist.addItem(product); message = 'Added to Wishlist'; }
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

  const handleReviewSubmit = async (data: { rating: number; title: string; review: string }) => {
    if (!id || !user) return;
    try {
      const payload: CreateReviewPayload = { productId: Number(id), ...data };
      const response = await api.products.createReview(id, payload);
      setReviews(prevReviews => [response, ...prevReviews]);
      setHasUserReviewed(true);
      // Optionally refetch rating data
      const ratingRes = await api.products.getRating(id);
      setRatingData(ratingRes);
      Toast.show({ type: 'success', text1: 'Review Posted', text2: 'Thank you!', position: 'bottom' });
    } catch (error) {
      console.error('Error posting review:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to post review.', position: 'bottom' });
      throw error;
    }
  };

  const ReviewItem = ({ review }: { review: Review }) => {
    const date = new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    return (
      <View style={[styles.reviewItem, { borderColor: colors.border }]}>
        <View style={styles.reviewHeader}>
          <ThemedText style={styles.reviewUserName}>{review.user?.name || 'Anonymous'}</ThemedText>
          <View style={styles.reviewRating}>
            <Star size={14} color={colors.warning} fill={colors.warning} />
            <ThemedText style={styles.ratingText}>{review.rating}</ThemedText>
          </View>
        </View>
        <ThemedText style={styles.reviewTitle}>{review.title}</ThemedText>
        <ThemedText style={styles.reviewContent}>{review.review}</ThemedText>
        <ThemedText style={styles.reviewDate}>{date}</ThemedText>
        {review.verifiedPurchase && <ThemedText style={[styles.verifiedPurchase, { color: colors.success }]}>Verified Purchase</ThemedText>}
      </View>
    );
  };

  if (isLoading || isAuthLoading) {
    return <ThemedView style={styles.centeredContainer}><ActivityIndicator size="large" color={colors.primary} /></ThemedView>;
  }
  if (!product) {
    return <ThemedView style={styles.centeredContainer}><ThemedText>Product not found</ThemedText></ThemedView>;
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContentContainer} showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View style={styles.imageContainer}>
          <ImageCarousel images={carouselImages} />
          <TouchableOpacity style={[styles.overlayButton, styles.backButton]} onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.overlayButton, styles.wishlistButtonOverlay]} onPress={handleWishlistToggle} disabled={updatingWishlist}>
            <Heart size={24} color={isInWishlist ? colors.error : colors.text} fill={isInWishlist ? colors.error : 'none'} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Product Details */}
        <View style={styles.detailsContainer}>
          {/* Name and Reviews Row */}
          <View style={styles.nameReviewRow}>
            <ThemedText type="title" style={styles.name}>{product.name}</ThemedText>
            {isLoadingRating ? <ActivityIndicator size="small" color={colors.textSecondary} /> : ratingData ? (
              <View style={styles.reviewContainer}>
                <Star size={16} color={colors.warning} fill={colors.warning} />
                <ThemedText style={styles.reviewText}>{ratingData.averageRating.toFixed(1)} ({ratingData.totalReviews} reviews)</ThemedText>
              </View>
            ) : null}
          </View>

          {/* Price Row */}
          <View style={styles.priceRow}>
            <ThemedText type="subtitle" style={styles.price}>₹{selectedVariant?.price || product.price}</ThemedText>
            {(selectedVariant?.mrp || product.mrp) > (selectedVariant?.price || product.price) && (
              <ThemedText style={styles.mrp}>₹{selectedVariant?.mrp || product.mrp}</ThemedText>
            )}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <ThemedText style={styles.descriptionText} numberOfLines={3}>{product.description.replace(/<[^>]*>/g, '')}</ThemedText>
          </View>

          {/* Size Selector */}
          {uniqueSizes.length > 0 && (
            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>Choose Size</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorScrollContainer}>
                {uniqueSizes.map((size: string) => (
                  <TouchableOpacity key={size} style={[styles.selectorButton, selectedSize === size ? styles.selectorButtonSelected : {}, { borderColor: colors.border, backgroundColor: selectedSize === size ? colors.text : colors.background }]} onPress={() => setSelectedSize(size)}>
                    <ThemedText style={[styles.selectorButtonText, selectedSize === size ? styles.selectorButtonTextSelected : {}, { color: selectedSize === size ? colors.background : colors.text }]}>{size}</ThemedText>
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
                {uniqueColors.map((color: string) => (
                  <TouchableOpacity key={color} style={[styles.colorSelectorButton, selectedColor === color ? styles.colorSelectorButtonSelected : {}, { backgroundColor: color, borderColor: selectedColor === color ? colors.primary : colors.border }]} onPress={() => setSelectedColor(color)} />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Variant Details */}
          {selectedVariant && (
            <View style={styles.section}>
              <View style={[styles.variantDetails, { backgroundColor: colors.card }]}>
                <ThemedText style={[styles.variantText, { color: colors.textSecondary }]}>Stock: {selectedVariant.stock} units</ThemedText>
                <ThemedText style={[styles.variantText, { color: colors.textSecondary }]}>SKU: {selectedVariant.sku}</ThemedText>
              </View>
            </View>
          )}

          {/* Specifications */}
          {product.specifications && (
            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>Specifications</ThemedText>
              <RenderHTML contentWidth={width - 40} source={{ html: product.specifications }} baseStyle={{ color: colors.text, opacity: colorScheme === 'dark' ? 0.7 : 0.8 }} tagsStyles={{ p: { marginVertical: 5, lineHeight: 22 }, li: { marginBottom: 8, lineHeight: 22 } }} />
            </View>
          )}

          {/* Rating Breakdown Section */}
          {ratingData && ratingData.totalReviews > 0 && (
            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>Ratings & Reviews</ThemedText>
              <View style={styles.ratingBreakdownContainer}>
                <View style={styles.ratingSummary}>
                  <ThemedText style={styles.averageRatingText}>{ratingData.averageRating.toFixed(1)}</ThemedText>
                  <Star size={20} color={colors.warning} fill={colors.warning} />
                  <ThemedText style={styles.totalReviewsText}>{ratingData.totalReviews} Reviews</ThemedText>
                </View>
                <View style={styles.ratingBars}>
                  <BarChart
                    data={ratingData.ratingCounts.map(item => ({ value: item.count, label: `${item.rating}★` })).reverse()}
                    barWidth={8} spacing={18} roundedTop roundedBottom hideRules xAxisThickness={0} yAxisThickness={0}
                    yAxisTextStyle={{ color: colorScheme === 'dark' ? colors.text : colors.textSecondary, fontSize: 10 }}
                    noOfSections={4} maxValue={ratingData.totalReviews > 0 ? ratingData.totalReviews : 1}
                    width={width * 0.5} height={100} barBorderRadius={4} frontColor={colors.warning} isAnimated
                    renderTooltip={(item: any) => (<View style={[styles.tooltip, { backgroundColor: colors.text }]}><ThemedText style={{ color: colors.background, fontSize: 10 }}>{item.value}</ThemedText></View>)}
                  />
                </View>
              </View>
            </View>
          )}

          {/* Reviews Section */}
          <View style={styles.section}>
            <View style={styles.reviewsHeader}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>Customer Reviews ({reviews.length})</ThemedText>
              {user && !hasUserReviewed && (
                <LoadingButton variant="outline" size="sm" onPress={() => setReviewModalVisible(true)} leftIcon={<MessageCircle size={16} color={colors.text} />}>
                  Write a Review
                </LoadingButton>
              )}
              {!user && (
                 <LoadingButton variant="outline" size="sm" onPress={() => router.push('/(auth)/login')}>
                   Login to Review
                 </LoadingButton>
              )}
            </View>
            {isLoadingReviews ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
            ) : reviews.length > 0 ? (
              <FlatList
                data={reviews}
                renderItem={({ item }) => <ReviewItem review={item} />}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false} // Disable scroll as it's inside ScrollView
                ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
              />
            ) : (
              <ThemedText style={{ textAlign: 'center', marginTop: 10, color: colors.textSecondary }}>No reviews yet. Be the first!</ThemedText>
            )}
          </View>

          {/* Pincode / Delivery Section */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Check Delivery</ThemedText>
            <View style={styles.pincodeContainer}>
              <TextInput style={[styles.pincodeInput, { borderColor: colors.border, color: colors.text }]} placeholder="Enter Pincode" placeholderTextColor={colors.textSecondary} keyboardType="numeric" maxLength={6} value={pincode} onChangeText={setPincode} />
              <LoadingButton size="sm" style={styles.pincodeButton} disabled={pincode.length !== 6} onPress={() => { /* API call? */ }}>Check</LoadingButton>
            </View>
            {deliveryDate && pincode.length === 6 && <ThemedText style={[styles.deliveryText, { color: colors.success }]}>Estimated delivery by {deliveryDate}</ThemedText>}
            {pincode.length > 0 && pincode.length < 6 && <ThemedText style={[styles.deliveryText, { color: colors.error }]}>Enter a valid 6-digit pincode</ThemedText>}
          </View>

          {/* Recommendations Section */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Recommended Products</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recommendationsContainer}>
              {recommendations.length === 0 ? <View style={styles.recommendationsLoading}><ActivityIndicator size="small" color={colors.primary} /></View> : recommendations.map((item) => (<RecommendationCard key={item.id} item={item} colors={colors} currentId={id} />))}
            </ScrollView>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomButtonContainer}>
        <View style={styles.loggedInBottomRow}>
          <View style={styles.buttonWrapper}>
            <LoadingButton 
              onPress={handleAddToCart} 
              style={styles.cartButton} 
              variant="outline" 
              disabled={addingToCart || (product.variants && product.variants.length > 0 && !selectedVariant)} 
              textStyle={{ color: colors.text }} 
              leftIcon={<ShoppingCart size={20} color={colors.text} />}
            >
              Cart
            </LoadingButton>
          </View>
          <View style={styles.buttonWrapper}>
            {user ? (
              <LoadingButton 
                onPress={handleBuyNow} 
                style={styles.buyButton} 
                disabled={product.variants && product.variants.length > 0 && !selectedVariant}
                leftIcon={<Zap size={20} color={colors.background} />}
              >
                Buy Now
              </LoadingButton>
            ) : (
              <LoadingButton 
                onPress={() => router.push('/(auth)/login')} 
                style={styles.buyButton} 
                leftIcon={<LogIn size={20} color={colors.background} />}
              >
                Login to Buy
              </LoadingButton>
            )}
          </View>
        </View>
      </View>

      {/* Review Modal */}
      <ReviewModal isVisible={reviewModalVisible} onClose={() => setReviewModalVisible(false)} onSubmit={handleReviewSubmit} />
    </SafeAreaView>
  );
}

const createStyles = (colors: typeof Colors.light, colorScheme: 'light' | 'dark' | null) =>
  StyleSheet.create({
    safeArea: { flex: 1 },
    container: { flex: 1, backgroundColor: colors.background },
    centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    scrollContentContainer: { paddingBottom: 90 },
    imageContainer: { position: 'relative', backgroundColor: colors.border },
    overlayButton: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 30, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.7)', justifyContent: 'center', alignItems: 'center', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }, android: { elevation: 3, backgroundColor: colors.card } }) },
    backButton: { left: 15 },
    wishlistButtonOverlay: { right: 15 },
    detailsContainer: { padding: 20, backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: -20, zIndex: 1 },
    nameReviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
    name: { flex: 1, fontSize: 22, fontWeight: '600', marginRight: 10, color: colors.text },
    reviewContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    reviewText: { marginLeft: 5, fontSize: 12, color: colors.textSecondary },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 20 },
    price: { fontSize: 24, fontWeight: 'bold', color: colors.text },
    mrp: { fontSize: 16, textDecorationLine: 'line-through', color: colors.textSecondary },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, color: colors.text },
    descriptionText: { fontSize: 14, lineHeight: 22, color: colors.textSecondary },
    selectorScrollContainer: { gap: 10 },
    selectorButton: { minWidth: 44, height: 44, borderRadius: 22, borderWidth: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 15 },
    selectorButtonText: { fontSize: 14, fontWeight: '600' },
    selectorButtonSelected: { backgroundColor: colors.text, borderColor: colors.text },
    selectorButtonTextSelected: { color: colors.background },
    colorSelectorButton: { width: 36, height: 36, borderRadius: 18, borderWidth: 2 },
    colorSelectorButtonSelected: { borderColor: colors.primary, borderWidth: 3 },
    variantDetails: { padding: 12, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between' },
    variantText: { fontSize: 14 },
    bottomButtonContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: Platform.OS === 'ios' ? 30 : 16, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 4 }, android: { elevation: 5 } }) },
    loggedInBottomRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    buttonWrapper: { flex: 1 },
    cartButton: { borderRadius: 30, height: 50, paddingHorizontal: 10, borderWidth: 1, borderColor: colors.text, backgroundColor: colors.background },
    buyButton: { borderRadius: 30, height: 50, paddingHorizontal: 10, backgroundColor: colors.text },
    recommendationsContainer: { paddingVertical: 8, paddingHorizontal: 16 },
    recommendationsLoading: { height: 200, width: '100%', justifyContent: 'center', alignItems: 'center' },
    pincodeContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    pincodeInput: { flex: 1, height: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 16 },
    pincodeButton: { height: 44, paddingHorizontal: 15 },
    deliveryText: { marginTop: 8, fontSize: 14, fontWeight: '500' },
    ratingBreakdownContainer: { flexDirection: 'row', alignItems: 'center', gap: 20 },
    ratingSummary: { alignItems: 'center', gap: 4 },
    averageRatingText: { fontSize: 36, fontWeight: 'bold', lineHeight: 40, color: colors.text },
    totalReviewsText: { fontSize: 12, color: colors.textSecondary },
    ratingBars: { flex: 1, paddingLeft: 10 },
    tooltip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    // Review Styles
    reviewsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    reviewItem: { padding: 16, borderRadius: 8, borderWidth: 1 },
    reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    reviewUserName: { fontWeight: '600', fontSize: 14 },
    reviewRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    ratingText: { fontSize: 12, fontWeight: '600' },
    reviewTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
    reviewContent: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
    reviewDate: { fontSize: 12, color: colors.textSecondary },
    verifiedPurchase: { fontSize: 12, fontWeight: '500', marginTop: 4 },
  });
