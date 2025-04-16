import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, SafeAreaView, ActivityIndicator } from 'react-native'; // Add ActivityIndicator
import { useLocalSearchParams, router } from 'expo-router'; // Import router
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import { ImageCarousel } from '@/components/product/ImageCarousel';
import { Button } from '@/components/ui/Button'; // Import Button
import { IconSymbol } from '@/components/ui/IconSymbol'; // Import IconSymbol
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { Product } from '@/types/api';

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, isLoading: isAuthLoading } = useAuth(); // Get auth state

  React.useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`https://lelehaat.com/api/products/${id}`);
        const data = await response.json();
        setProduct(data);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  if (!product) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Product not found</ThemedText>
      </ThemedView>
    );
  }

  // Handle both string array and JSON string formats
  let productImages: string[] = [];
  try {
    if (product.images) {
      // Remove escaped quotes and parse
      const cleanJson = product.images.replace(/\\/g, '');
      productImages = JSON.parse(cleanJson);
    }
  } catch (error) {
    console.error('Error parsing images:', error);
  }

  const mainImage = product.imageUrl ?? product.image_url; // Prioritize imageUrl for single product

  const handleAddToCart = () => {
    // TODO: Implement Add to Cart logic
    console.log('Add to cart:', product.id);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContentContainer} // Add padding for floating button
      >
        <ImageCarousel images={[mainImage, ...productImages]} />
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
                <ThemedText style={styles.discount}>
                  {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF
                </ThemedText>
              </View>
            )}
          </View>

          {/* Removed Button from here */}

          {product.specifications && (
            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>Specifications</ThemedText>
              <ThemedText style={styles.sectionContent}>{product.specifications}</ThemedText>
            </View>
          )}

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Description</ThemedText>
            <ThemedText style={styles.sectionContent}>{product.description}</ThemedText>
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

      {/* Floating Button Container */}
      <View style={[styles.floatingButtonContainer, { borderTopColor: colors.border }]}>
        {isAuthLoading ? (
          // Show a loader while checking auth status
          <ActivityIndicator color={colors.primary} />
        ) : user ? (
          // User is logged in: Show Add to Cart
          <Button
            onPress={handleAddToCart}
            fullWidth
            leftIcon={<IconSymbol name="cart.badge.plus" size={20} color={colors.background} />}>
            Add to Cart
          </Button>
        ) : (
          // User is not logged in: Show Login button
          <Button
            onPress={() => router.push('/(auth)/login')} // Navigate to login
            fullWidth
            variant="secondary" // Use a different style?
            leftIcon={<IconSymbol name="person.fill" size={20} color={colors.background} />}>
            Login to Add to Cart
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 100, // Space for floating button
  },
  content: {
    padding: 20,
  },
  name: {
    fontSize: 26, // Slightly larger
    marginBottom: 12, // Increased margin
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline', // Align baseline for better text alignment
    gap: 10, // Adjusted gap
    marginBottom: 20, // Increased margin
  },
  price: {
    fontSize: 30, // Larger price
    fontWeight: 'bold',
  },
  discountContainer: {
    flexDirection: 'row', // Align discount horizontally
    alignItems: 'baseline',
    gap: 6,
  },
  mrp: {
    fontSize: 18, // Larger MRP
    textDecorationLine: 'line-through',
    opacity: 0.6, // Slightly less opacity
  },
  discount: {
    fontSize: 16, // Larger discount text
    color: Colors.light.success, // Use theme color
    fontWeight: '600',
  },
  // Removed addToCartButton style
  section: {
    marginTop: 20,
    marginBottom: 12, // Add bottom margin
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10, // Increased margin
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 24, // Improve readability
    opacity: 0.8,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 24, // Extra padding for safe area bottom inset
    backgroundColor: Colors.light.background, // Use theme background
    borderTopWidth: 1,
    elevation: 5, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});
