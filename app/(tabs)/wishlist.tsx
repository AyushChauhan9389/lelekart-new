import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator, RefreshControl, Platform, Pressable, Image } from 'react-native';
import { router, Stack } from 'expo-router';
import { NavigationHeader } from '@/components/ui/NavigationHeader';
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
  const styles = useMemo(() => createStyles(colors, colorScheme), [colors, colorScheme]);
  const { user, isLoading: isAuthLoading } = useAuth();

  const fetchWishlist = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
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
  }, [user]); // Refetch when user logs in/out

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
        <Heart size={64} color={colors.text} style={{ opacity: colorScheme === 'dark' ? 0.4 : 0.5 }} />
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
        <Heart size={64} color={colors.text} style={{ opacity: colorScheme === 'dark' ? 0.4 : 0.5 }} />
        <ThemedText type="title" style={styles.emptyText}>Your wishlist is empty</ThemedText>
        <ThemedText style={styles.emptySubtext}>
          Save items you like by tapping the heart icon
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <NavigationHeader title="My Wishlist" />
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
                <ThemedText style={[styles.price, { color: colors.primary }]}>
                  ₹{item.product.price}
                </ThemedText>
                {item.product.mrp > item.product.price && (
                  <View style={styles.priceContainer}>
                    <ThemedText style={styles.mrp}>₹{item.product.mrp}</ThemedText>
                    <ThemedText style={[styles.discount, { color: colors.success }]}>
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

const createStyles = (colors: typeof Colors.light, colorScheme: 'light' | 'dark' | null) =>
  StyleSheet.create({
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
      opacity: colorScheme === 'dark' ? 0.5 : 0.7,
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
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      ...Platform.select({
        ios: {
          shadowColor: colorScheme === 'dark' ? colors.background : colors.text,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: colorScheme === 'dark' ? 0.3 : 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    itemCardPressed: {
      opacity: colorScheme === 'dark' ? 0.7 : 0.8,
    },
    productImage: {
      width: 100,
      height: 100,
      resizeMode: 'cover',
      backgroundColor: colors.border, // Placeholder background
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
      opacity: colorScheme === 'dark' ? 0.5 : 0.6,
    },
    discount: {
      fontSize: 14,
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
