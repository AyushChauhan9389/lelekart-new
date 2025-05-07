import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator, RefreshControl, Platform, Pressable, Image } from 'react-native';
import { storage } from '@/utils/storage';
import Toast from 'react-native-toast-message';
import { router, useFocusEffect } from 'expo-router'; // Removed Stack as header is handled by layout
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { api } from '@/utils/api';
import type { WishlistItem } from '@/types/api';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Heart, ChevronRight, Trash2 } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { LoginPrompt } from '@/components/ui/LoginPrompt';

export default function AccountWishlistScreen() { // Renamed function
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [imageLoadingStates, setImageLoadingStates] = useState<{ [key: number]: boolean }>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<number | null>(null);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => createStyles(colors, colorScheme), [colors, colorScheme]);
  const { user, isLoading: isAuthLoading } = useAuth();

  const fetchWishlist = async () => {
    try {
      if (user) {
        const wishlistItems = await api.wishlist.getItems();
        setItems(wishlistItems);
      } else {
        const localItems = await storage.wishlist.getItems();
        setItems(localItems.map(item => ({
          id: item.productId,
          userId: 0,
          productId: item.productId,
          product: item.product,
          dateAdded: item.dateAdded
        })));
      }
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchWishlist();
      Toast.show({
        type: 'success',
        text1: 'Wishlist updated',
        position: 'bottom',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to refresh',
        text2: 'Please try again',
        position: 'bottom',
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [user]); // Added user dependency for onRefresh

  useFocusEffect(
    useCallback(() => {
      fetchWishlist();
    }, [user]) // Added user dependency for useFocusEffect
  );

  const handleRemoveItem = async (productId: number) => {
    try {
      setRemovingItemId(productId);
      if (user) {
        await api.wishlist.removeItem(productId);
      } else {
        await storage.wishlist.removeItem(productId);
      }
      Toast.show({
        type: 'success',
        text1: 'Item removed from wishlist',
        position: 'bottom',
      });
      await fetchWishlist();
    } catch (error) {
      console.error('Failed to remove item:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to remove item',
        text2: 'Please try again',
        position: 'bottom',
      });
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
  
  // If not logged in and trying to access account wishlist, show login prompt
  if (!user) {
    return <LoginPrompt />;
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
      {/* Stack.Screen and NavigationHeader removed as header is handled by layout */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.card}
            progressViewOffset={Platform.OS === 'android' ? 80 : 0}
          />
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
            <View style={[styles.productImageContainer, { backgroundColor: colors.surface }]}>
              {imageLoadingStates[item.product.id] && (
                <View style={styles.imageLoadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              )}
              <Image
                source={{ uri: (() => {
                let imageUrl = item.product.imageUrl || item.product.image_url;
                if (!imageUrl && item.product.images) {
                  try {
                    const images = typeof item.product.images === 'string' 
                      ? JSON.parse(item.product.images) 
                      : item.product.images;
                    if (Array.isArray(images) && images.length > 0) {
                      imageUrl = images[0];
                    }
                  } catch {
                  }
                }
                return imageUrl || 'https://lelekart.in/images/electronics.svg';
              })() }}
                  style={[
                    styles.productImage,
                    imageLoadingStates[item.product.id] && { opacity: 0 }
                  ]}
                  onLoadStart={() => setImageLoadingStates(prev => ({ ...prev, [item.product.id]: true }))}
                  onLoadEnd={() => setImageLoadingStates(prev => ({ ...prev, [item.product.id]: false }))}
                />
            </View>
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
    loginButton: { // Kept for LoginPrompt if it uses it, otherwise can be removed
      marginTop: 20,
      minWidth: 120,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    },
    itemCard: {
      marginHorizontal: 16, // Consistent with original
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
    productImageContainer: {
      width: 100,
      height: 100,
      borderTopLeftRadius: 12,
      borderBottomLeftRadius: 12,
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
    },
    imageLoadingContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    productImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'contain',
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
