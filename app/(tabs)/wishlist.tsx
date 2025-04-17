import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator, RefreshControl, Platform, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { api } from '@/utils/api';
import type { WishlistItem } from '@/types/api';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Heart, ChevronRight, Trash2 } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

export default function WishlistScreen() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<number | null>(null);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, isLoading: isAuthLoading } = useAuth();

  const fetchWishlist = async () => {
    try {
      const wishlistItems = await api.wishlist.getItems();
      setItems(wishlistItems);
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchWishlist();
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemoveItem = async (productId: number) => {
    try {
      setRemovingItemId(productId);
      await api.wishlist.removeItem(productId);
      setItems(items.filter(item => item.productId !== productId));
    } catch (error) {
      console.error('Failed to remove item:', error);
    } finally {
      setRemovingItemId(null);
    }
  };

  if (isLoading || isAuthLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  if (!user) {
    return (
      <ThemedView style={styles.emptyContainer}>
        <Heart size={64} color={colors.text} style={{ opacity: 0.5 }} />
        <ThemedText type="title" style={styles.emptyText}>Login to view wishlist</ThemedText>
        <Button 
          onPress={() => router.push('/(auth)/login')}
          style={styles.loginButton}>
          Login
        </Button>
      </ThemedView>
    );
  }

  if (items.length === 0) {
    return (
      <ThemedView style={styles.emptyContainer}>
        <Heart size={64} color={colors.text} style={{ opacity: 0.5 }} />
        <ThemedText type="title" style={styles.emptyText}>Your wishlist is empty</ThemedText>
        <ThemedText style={styles.emptySubtext}>
          Save items you like by tapping the heart icon
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {items.map(item => (
          <Pressable
            key={item.id}
            style={({ pressed }) => [
              styles.itemCard,
              { backgroundColor: colors.surface },
              pressed && styles.itemCardPressed
            ]}
            onPress={() => router.push(`/product/${item.product.id}`)}
          >
            <Image
              source={{ uri: item.product.imageUrl || item.product.image_url }}
              style={styles.productImage}
            />
            <View style={styles.itemContent}>
              <View style={styles.itemDetails}>
                <ThemedText numberOfLines={2} style={styles.productName}>
                  {item.product.name}
                </ThemedText>
                <ThemedText style={styles.price}>
                  ₹{item.product.price}
                </ThemedText>
                {item.product.mrp > item.product.price && (
                  <View style={styles.priceContainer}>
                    <ThemedText style={styles.mrp}>₹{item.product.mrp}</ThemedText>
                    <ThemedText style={styles.discount}>
                      {Math.round(((item.product.mrp - item.product.price) / item.product.mrp) * 100)}% OFF
                    </ThemedText>
                  </View>
                )}
              </View>
              <View style={styles.actionContainer}>
                <Button
                  variant="ghost"
                  onPress={() => handleRemoveItem(item.product.id)}
                  disabled={removingItemId === item.product.id}
                  style={styles.removeButton}
                >
                  <Trash2 size={20} color={colors.error} />
                </Button>
                <ChevronRight size={20} color={colors.textSecondary} />
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 20,
  },
  emptySubtext: {
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.7,
  },
  loginButton: {
    marginTop: 20,
    minWidth: 120,
  },
  scrollView: {
    flex: 1,
    paddingTop: 16,
  },
  itemCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  itemCardPressed: {
    opacity: 0.8,
  },
  productImage: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
  },
  itemContent: {
    flex: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemDetails: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 16,
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  mrp: {
    fontSize: 14,
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  discount: {
    fontSize: 14,
    color: Colors.light.success,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  removeButton: {
    padding: 8,
  },
});
