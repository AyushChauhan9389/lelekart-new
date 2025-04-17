import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator, Pressable, RefreshControl, Platform } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { api } from '@/utils/api';
import type { Order } from '@/types/api';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Package, ChevronRight } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

export default function OrdersScreen() {
  const [ordersData, setOrdersData] = useState<{ orders: Order[]; total: number }>({ orders: [], total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, isLoading: isAuthLoading } = useAuth();

  const fetchOrders = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      setError(null);
      const data = await api.orders.getOrders();
      setOrdersData(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Unable to load orders. Please try again.');
      setOrdersData({ orders: [], total: 0 }); // Clear data on error
    } finally {
      setIsLoading(false);
    }
  }, [user]); // Depend on user

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]); // Fetch when component mounts or fetchOrders changes

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setIsRefreshing(false);
  }, [fetchOrders]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return colors.success;
      case 'processing':
      case 'confirmed':
      case 'pending': // Added pending
        return colors.warning;
      case 'cancelled':
        return colors.error;
      default:
        return colors.text;
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Render Loading State
  if (isLoading || isAuthLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  // Render Login Prompt if not logged in
  if (!user) {
    return (
      <ThemedView style={styles.emptyContainer}>
        <Package size={64} color={colors.text} style={{ opacity: 0.5 }} />
        <ThemedText type="title" style={styles.emptyText}>Login to view orders</ThemedText>
        <Button 
          onPress={() => router.push('/(auth)/login')}
          style={styles.loginButton}>
          Login
        </Button>
      </ThemedView>
    );
  }

  // Render Error State
  if (error) {
    return (
      <ThemedView style={styles.emptyContainer}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <Button 
          onPress={fetchOrders}
          style={styles.retryButton}>
          Retry
        </Button>
      </ThemedView>
    );
  }

  // Render Empty State
  if (!ordersData.orders || ordersData.orders.length === 0) {
    return (
      <ThemedView style={styles.emptyContainer}>
        <Package size={64} color={colors.text} style={{ opacity: 0.5 }} />
        <ThemedText type="title" style={styles.emptyText}>No orders yet</ThemedText>
        <ThemedText style={styles.emptySubtext}>
          Your orders will appear here once you make a purchase.
        </ThemedText>
      </ThemedView>
    );
  }

  // Render Orders List
  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {ordersData.orders.map(order => (
          <Pressable
            key={order.id}
            style={({ pressed }) => [
              styles.orderCard,
              { backgroundColor: colors.surface },
              pressed && styles.orderCardPressed
            ]}
            onPress={() => {
              if (typeof order.id === 'number') {
                router.push(`/orders/${order.id}`);
              } else {
                console.error("Invalid order ID:", order.id);
              }
            }}
          >
            <View style={styles.orderContent}>
              <View style={styles.orderHeader}>
                <ThemedText type="subtitle" numberOfLines={1} style={styles.orderId}>
                  Order #{order.id}
                </ThemedText>
                <ThemedText style={styles.orderDate}>
                  {formatDate(order.createdAt || order.date)}
                </ThemedText>
              </View>

              <View style={styles.orderDetails}>
                {order.items && order.items.length > 0 && (
                  <View style={styles.itemsList}>
                    {order.items.slice(0, 2).map((item) => (
                      <ThemedText key={item.id} numberOfLines={1} style={styles.itemText}>
                        {item.quantity}× {item.product?.name || `Product #${item.productId}`}
                      </ThemedText>
                    ))}
                    {order.items.length > 2 && (
                      <ThemedText style={styles.moreItems}>
                        +{order.items.length - 2} more items
                      </ThemedText>
                    )}
                  </View>
                )}

                <View style={styles.orderFooter}>
                  <View style={styles.priceInfo}>
                    <ThemedText style={styles.total}>
                      {formatCurrency(order.finalAmount ?? order.total)}
                    </ThemedText>
                    {order.walletCoinsUsed && order.walletCoinsUsed > 0 && (
                      <ThemedText style={styles.coinsUsed}>
                        ({order.walletCoinsUsed} coins used)
                      </ThemedText>
                    )}
                  </View>

                  <View style={styles.statusContainer}>
                    <ThemedText style={[
                      styles.status,
                      { color: getStatusColor(order.status) }
                    ]}>
                      {order.status?.toUpperCase() || 'UNKNOWN'}
                    </ThemedText>
                    <ChevronRight size={20} color={colors.textSecondary} />
                  </View>
                </View>
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
  scrollView: {
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
  errorText: {
    marginBottom: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  loginButton: {
    marginTop: 20,
    minWidth: 120,
  },
  retryButton: {
    marginTop: 12,
    minWidth: 120,
  },
  orderCard: {
    marginHorizontal: 16,
    marginTop: 16, // Add top margin for spacing
    borderRadius: 12,
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
  orderCardPressed: {
    opacity: 0.8,
  },
  orderContent: {
    padding: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  orderDate: {
    fontSize: 14,
    opacity: 0.6,
  },
  orderDetails: {
    gap: 12,
  },
  itemsList: {
    gap: 4,
  },
  itemText: {
    fontSize: 14,
  },
  moreItems: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 2,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  total: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  coinsUsed: {
    fontSize: 14,
    opacity: 0.6,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
  },
});
