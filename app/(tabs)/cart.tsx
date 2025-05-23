import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { storage } from '@/utils/storage';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  Image, 
  ActivityIndicator, 
  RefreshControl, 
  Platform, 
  Dimensions,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/utils/api';
import type { CartItem, StoredProduct } from '@/types/api';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { LoginPrompt } from '@/components/ui/LoginPrompt';
import { useCartUpdate } from '@/app/_layout'; // Import the hook from global layout

export default function CartScreen() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingItem, setUpdatingItem] = useState<number | null>(null);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { triggerCartUpdate } = useCartUpdate(); // Use the hook
  
  const styles = useMemo(() => createStyles(colors, colorScheme), [colors, colorScheme]);

  const fetchCart = async () => {
    try {
      if (user) {
        const items = await api.cart.getItems();
        setCartItems(items);
      } else {
        const localItems = await storage.cart.getItems();
        setCartItems(localItems.map(item => ({
          id: item.product.id,
          userId: 0,
          quantity: item.quantity,
          product: item.product as StoredProduct // Cast to handle complete product data
        })));
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchCart();
    setIsRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCart();
    }, [])
  );

  const handleUpdateQuantity = async (id: number, quantity: number) => {
    if (quantity < 1) return;
    setUpdatingItem(id);
    try {
      if (user) {
        const result = await api.cart.updateQuantity(id, quantity);
        setCartItems(prevItems =>
          prevItems.map(item =>
            item.id === id ? { ...item, quantity: result.quantity } : item
          )
        );
      } else {
        await storage.cart.updateQuantity(id, quantity);
        const localItems = await storage.cart.getItems();
        setCartItems(localItems.map(item => ({
          id: item.product.id,
          userId: 0,
          quantity: item.quantity,
          product: item.product as StoredProduct
        })));
      }
    } catch (error) {
      console.error('Failed to update quantity:', error);
      await fetchCart();
    } finally {
      setUpdatingItem(null);
      triggerCartUpdate(); // Trigger update
    }
  };

  const handleRemoveItem = async (id: number) => {
    setUpdatingItem(id);
    try {
      if (user) {
        await api.cart.removeItem(id);
      } else {
        await storage.cart.removeItem(id);
      }
      setCartItems(prevItems => prevItems.filter(item => item.id !== id));
    } catch (error) {
      console.error('Failed to remove item:', error);
      await fetchCart(); // Keep local fetch for immediate UI update before context triggers
    } finally {
      setUpdatingItem(null);
      triggerCartUpdate(); // Trigger update
    }
  };

  const SHIPPING_COST = 0;
  const subtotalAmount = cartItems.reduce(
    (sum, item) => sum + (item.product.price * item.quantity),
    0
  );
  const totalAmount = subtotalAmount + SHIPPING_COST;

  if (isAuthLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  if (cartItems.length === 0) {
    return (
      <ThemedView style={styles.emptyContainer}>
        <View style={[styles.emptyIconContainer, { backgroundColor: colors.surface }]}>
          <ShoppingCart size={48} color={colors.text} style={{ opacity: 0.7 }} />
        </View>
        <ThemedText type="title" style={styles.emptyText}>Your cart is empty</ThemedText>
        <ThemedText style={styles.emptySubtext}>
          Explore products and add your favorite items to cart
        </ThemedText>
        <Button 
          style={styles.exploreButton}
          onPress={() => router.push('/(tabs)')}>
          Start Shopping
        </Button>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {cartItems.map(item => {
          // Get the first image from the product
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
              // Ignore parsing error, use default image
            }
          }

          return (
            <View key={item.id} style={[styles.cartItem, { backgroundColor: colors.background }]}>
              <Image
                source={{ uri: imageUrl }}
                style={[styles.productImage, { backgroundColor: colors.surface }]}
              />
              <View style={styles.itemDetails}>
                <ThemedText numberOfLines={2} style={styles.productName}>
                  {item.product.name}
                </ThemedText>
                <View style={styles.priceBlock}>
                  <View style={styles.priceRow}>
                    <ThemedText style={[styles.price, { color: colors.primary }]}>
                      ₹{item.product.price}
                    </ThemedText>
                    {item.product.mrp > item.product.price && (
                      <>
                        <ThemedText style={[styles.mrp, { color: colors.textSecondary }]}>
                          ₹{item.product.mrp}
                        </ThemedText>
                        <View style={[styles.discountBadge, { backgroundColor: colorScheme === 'dark' ? `${colors.success}30` : `${colors.success}15` }]}>
                          <ThemedText style={[styles.discountText, { color: colors.success }]}>
                            {Math.round(((item.product.mrp - item.product.price) / item.product.mrp) * 100)}% OFF
                          </ThemedText>
                        </View>
                      </>
                    )}
                  </View>
                  <View style={styles.subtotalRow}>
                    <ThemedText style={[styles.itemSubtotal, { color: colors.textSecondary }]}>
                      Total: ₹{item.product.price * item.quantity}
                    </ThemedText>
                    {item.product.mrp > item.product.price && (
                      <ThemedText style={[styles.savingsText, { color: colors.success }]}>
                        Save: ₹{(item.product.mrp - item.product.price) * item.quantity}
                      </ThemedText>
                    )}
                  </View>
                </View>
                
                <View style={[styles.quantityContainer, { backgroundColor: colors.surface }]}>
                  <Pressable
                    onPress={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                    disabled={updatingItem === item.id || item.quantity <= 1}
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.quantityButton,
                      { backgroundColor: colors.background, borderColor: colors.border },
                      pressed && [styles.buttonPressed, { backgroundColor: colors.surface }],
                      (updatingItem === item.id || item.quantity <= 1) && styles.buttonDisabled
                    ]}
                  >
                    <Minus size={18} color={updatingItem === item.id || item.quantity <= 1 ? colors.textSecondary : colors.text} />
                  </Pressable>
                  
                  <ThemedText style={styles.quantity}>{item.quantity}</ThemedText>
                  
                  <Pressable
                    onPress={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                    disabled={updatingItem === item.id}
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.quantityButton,
                      { backgroundColor: colors.background, borderColor: colors.border },
                      pressed && [styles.buttonPressed, { backgroundColor: colors.surface }],
                      updatingItem === item.id && styles.buttonDisabled
                    ]}
                  >
                    <Plus size={18} color={updatingItem === item.id ? colors.textSecondary : colors.text} />
                  </Pressable>
                  
                  <Pressable
                    onPress={() => handleRemoveItem(item.id)}
                    disabled={updatingItem === item.id}
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.removeButton,
                      { 
                        borderColor: `${colors.error}30`,
                        backgroundColor: colorScheme === 'dark' ? `${colors.error}20` : `${colors.error}10`
                      },
                      pressed && styles.buttonPressed,
                      updatingItem === item.id && styles.buttonDisabled
                    ]}
                  >
                    <Trash2 size={18} color={updatingItem === item.id ? colors.textSecondary : colors.error} />
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <View style={[styles.totalDetails, { backgroundColor: colors.surface }]}>
          <View style={styles.totalRow}>
            <ThemedText style={[styles.totalLabel, { color: colors.textSecondary }]}>
              Subtotal:
            </ThemedText>
            <ThemedText style={styles.totalValue}>₹{subtotalAmount}</ThemedText>
          </View>
          <View style={styles.totalRow}>
            <ThemedText style={[styles.totalLabel, { color: colors.textSecondary }]}>
              Shipping:
            </ThemedText>
            <ThemedText style={styles.totalValue}>₹{SHIPPING_COST}</ThemedText>
          </View>
          <View style={[styles.totalRow, styles.grandTotal, { borderTopColor: colors.border }]}>
            <ThemedText style={[styles.totalLabel, { color: colors.textSecondary }]}>
              Total:
            </ThemedText>
            <ThemedText type="title" style={[styles.grandTotalAmount, { color: colors.primary }]}>
              ₹{totalAmount}
            </ThemedText>
          </View>
        </View>
        <Button 
          fullWidth 
          onPress={() => router.push(user ? '/checkout' : '/(auth)/login')}>
          {user ? 'Continue to Checkout' : 'Login to Checkout'}
        </Button>
      </View>
    </ThemedView>
  );
}

const createStyles = (colors: typeof Colors.light, colorScheme: 'light' | 'dark' | null) =>
  StyleSheet.create({
    scrollContent: {
      paddingBottom: 16,
    },
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
    scrollView: {
      flex: 1,
    },
    cartItem: {
      flexDirection: 'row',
      padding: 16,
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 16,
      ...Platform.select({
        ios: {
          shadowColor: colors.text,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: colorScheme === 'dark' ? 0.3 : 0.08,
          shadowRadius: 12,
        },
        android: {
          elevation: 3,
        },
      }),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    productImage: {
      width: 90,
      height: 90,
      borderRadius: 12,
      marginRight: 16,
    },
    itemDetails: {
      flex: 1,
      justifyContent: 'space-between',
      minHeight: 90,
    },
    productName: {
      fontSize: 15,
      marginBottom: 6,
      lineHeight: 20,
    },
    priceBlock: {
      marginVertical: 6,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    price: {
      fontSize: 17,
      fontWeight: 'bold',
    },
    mrp: {
      fontSize: 15,
      textDecorationLine: 'line-through',
    },
    subtotalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
    },
    itemSubtotal: {
      fontSize: 13,
    },
    savingsText: {
      fontSize: 13,
      fontWeight: '500',
    },
    discountBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    discountText: {
      fontSize: 12,
      fontWeight: '600',
    },
    quantityContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 10,
      padding: 4,
      alignSelf: 'flex-start',
      gap: 4,
      flexWrap: 'wrap',
    },
    quantityButton: {
      width: 36,
      height: 36,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: StyleSheet.hairlineWidth,
    },
    buttonPressed: {
      opacity: 0.7,
    },
    buttonDisabled: {
      opacity: 0.4,
    },
    quantity: {
      minWidth: 32,
      textAlign: 'center',
      fontSize: 15,
      fontWeight: 'bold',
    },
    removeButton: {
      width: 36,
      height: 36,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
      borderWidth: StyleSheet.hairlineWidth,
    },
    footer: {
      padding: 16,
      paddingBottom: 32,
      borderTopWidth: 1,
    },
    totalDetails: {
      marginBottom: 16,
      padding: 16,
      borderRadius: 12,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    totalLabel: {
      fontSize: 14,
    },
    totalValue: {
      fontSize: 15,
      fontWeight: '600',
    },
    grandTotal: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      marginBottom: 0,
    },
    grandTotalAmount: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    emptyIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    exploreButton: {
      marginTop: 24,
      minWidth: 200,
    },
  });
