import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator, RefreshControl, Platform, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { api } from '@/utils/api';
import type { Order } from '@/types/api';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Package, ChevronRight } from 'lucide-react-native';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const fetchOrders = async () => {
    try {
      let fetchedOrders = await api.orders.getOrders();
      // Ensure fetchedOrders is always an array
      if (!Array.isArray(fetchedOrders)) {
        // If the API returns a single object for one order, wrap it in an array
        // Or handle other potential non-array responses if necessary
        fetchedOrders = fetchedOrders ? [fetchedOrders] : []; 
      }
      setOrders(fetchedOrders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setOrders([]); // Set to empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  if (orders.length === 0) {
    return (
      <ThemedView style={styles.emptyContainer}>
        <Package size={64} color={colors.text} style={{ opacity: 0.5 }} />
        <ThemedText type="title" style={styles.emptyText}>No orders yet</ThemedText>
        <ThemedText style={styles.emptySubtext}>
          Your past orders will appear here.
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
        {orders.map(order => (
          <Pressable 
            key={order.id} 
            style={({ pressed }) => [
              styles.orderCard, 
              { backgroundColor: colors.surface },
              pressed && styles.orderCardPressed
            ]}
            onPress={() => router.push(`/orders/${order.id}` as any)} // Use type assertion
          >
            <View style={styles.orderContent}>
              <View style={styles.orderHeader}>
                <ThemedText style={styles.orderId}>Order #{order.id}</ThemedText>
                <ThemedText style={styles.orderDate}>{formatDate(order.date)}</ThemedText>
              </View>
              <View style={styles.orderDetails}>
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Status:</ThemedText>
                  <ThemedText style={[styles.status, { color: order.status === 'pending' ? colors.warning : colors.success }]}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Total:</ThemedText>
                  <ThemedText style={styles.totalAmount}>₹{order.total}</ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Payment:</ThemedText>
                  <ThemedText style={styles.detailValue}>{order.paymentMethod.toUpperCase()}</ThemedText>
                </View>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} style={styles.chevronIcon} />
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
  scrollView: {
    flex: 1,
    paddingTop: 16,
  },
  orderCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  orderId: {
    fontSize: 15,
    fontWeight: '600',
  },
  orderDate: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  orderDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  status: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  orderCardPressed: {
    opacity: 0.8,
    backgroundColor: Colors.light.border,
  },
  orderContent: {
    flex: 1,
  },
  chevronIcon: {
    marginLeft: 12,
    opacity: 0.6,
  },
});
