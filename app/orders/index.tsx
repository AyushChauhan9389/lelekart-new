import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator, Pressable, RefreshControl, Platform } from 'react-native';
import { router, Stack } from 'expo-router';
import { NavigationHeader } from '@/components/ui/NavigationHeader';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { api } from '@/utils/api';
import type { Order } from '@/types/api';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Package, ChevronRight } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { LoginPrompt } from '@/components/ui/LoginPrompt'; // Import LoginPrompt

export default function OrdersScreen() {
  const [ordersData, setOrdersData] = useState<{ orders: Order[]; total: number }>({ orders: [], total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => createStyles(colors, colorScheme), [colors, colorScheme]);
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
      setOrdersData({ orders: [], total: 0 });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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
      case 'pending':
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

  if (isLoading || isAuthLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  // Show login prompt if user is not logged in
  if (!user) {
    return <LoginPrompt />;
  }

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

  if (!ordersData.orders || ordersData.orders.length === 0) {
    return (
      <ThemedView style={styles.emptyContainer}>
        <Package size={64} color={colors.text} style={{ opacity: colorScheme === 'dark' ? 0.4 : 0.5 }} />
        <ThemedText type="title" style={styles.emptyText}>No orders yet</ThemedText>
        <ThemedText style={styles.emptySubtext}>
          Your orders will appear here once you make a purchase.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <NavigationHeader title="My Orders" />
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
                <ThemedText style={[styles.orderDate, { color: colors.textSecondary }]}>
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
                      <ThemedText style={[styles.moreItems, { color: colors.textSecondary }]}>
                        +{order.items.length - 2} more items
                      </ThemedText>
                    )}
                  </View>
                )}

                <View style={styles.orderFooter}>
                  <View style={styles.priceInfo}>
                    <ThemedText style={[styles.total, { color: colors.primary }]}>
                      {formatCurrency(order.finalAmount ?? order.total)}
                    </ThemedText>
                    {order.walletCoinsUsed && order.walletCoinsUsed > 0 && (
                      <ThemedText style={[styles.coinsUsed, { color: colors.textSecondary }]}>
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

const createStyles = (colors: typeof Colors.light, colorScheme: 'light' | 'dark' | null) =>
  StyleSheet.create({
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
      opacity: colorScheme === 'dark' ? 0.5 : 0.7,
    },
    errorText: {
      marginBottom: 16,
      textAlign: 'center',
      opacity: colorScheme === 'dark' ? 0.5 : 0.7,
    },
    // Removed loginButton style as it's handled by LoginPrompt
    // loginButton: { ... },
    retryButton: {
      marginTop: 12,
      minWidth: 120,
    },
    orderCard: {
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 12,
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
    orderCardPressed: {
      opacity: colorScheme === 'dark' ? 0.7 : 0.8,
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
    },
    coinsUsed: {
      fontSize: 14,
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
