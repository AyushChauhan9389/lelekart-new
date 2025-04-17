import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { api } from '@/utils/api';
import type { Order, OrderItem } from '@/types/api';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const fetchedOrder = await api.orders.getOrderById(parseInt(id, 10));
        setOrder(fetchedOrder);
      } catch (error) {
        console.error('Failed to fetch order details:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  if (!order) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Order not found.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: `Order #${order.id}` }} />
      
      <View style={styles.section}>
        <ThemedText type="subtitle">Order Summary</ThemedText>
        <View style={styles.detailRow}>
          <ThemedText style={styles.detailLabel}>Order ID:</ThemedText>
          <ThemedText style={styles.detailValue}>#{order.id}</ThemedText>
        </View>
        <View style={styles.detailRow}>
          <ThemedText style={styles.detailLabel}>Date:</ThemedText>
          <ThemedText style={styles.detailValue}>{formatDate(order.date)}</ThemedText>
        </View>
        <View style={styles.detailRow}>
          <ThemedText style={styles.detailLabel}>Status:</ThemedText>
          <ThemedText style={[styles.status, { color: order.status === 'pending' ? colors.warning : colors.success }]}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </ThemedText>
        </View>
        <View style={styles.detailRow}>
          <ThemedText style={styles.detailLabel}>Payment:</ThemedText>
          <ThemedText style={styles.detailValue}>{order.paymentMethod.toUpperCase()}</ThemedText>
        </View>
        <View style={styles.detailRow}>
          <ThemedText style={styles.detailLabel}>Total:</ThemedText>
          <ThemedText style={styles.totalAmount}>₹{order.total}</ThemedText>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="subtitle">Items Ordered ({order.items?.length || 0})</ThemedText>
        {order.items?.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <Image source={{ uri: item.product.imageUrl || item.product.image_url }} style={styles.itemImage} />
            <View style={styles.itemInfo}>
              <ThemedText numberOfLines={2} style={styles.itemName}>{item.product.name}</ThemedText>
              <ThemedText style={styles.itemPrice}>Price: ₹{item.price}</ThemedText>
              <ThemedText style={styles.itemQuantity}>Quantity: {item.quantity}</ThemedText>
              <ThemedText style={styles.itemTotal}>Item Total: ₹{item.price * item.quantity}</ThemedText>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <ThemedText type="subtitle">Shipping Details</ThemedText>
        <ThemedText>{order.shippingDetails.name}</ThemedText>
        <ThemedText>{order.shippingDetails.address}</ThemedText>
        <ThemedText>{order.shippingDetails.city}, {order.shippingDetails.state} {order.shippingDetails.zipCode}</ThemedText>
        <ThemedText>Phone: {order.shippingDetails.phone}</ThemedText>
        <ThemedText>Email: {order.shippingDetails.email}</ThemedText>
        {order.shippingDetails.notes && <ThemedText>Notes: {order.shippingDetails.notes}</ThemedText>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
    backgroundColor: Colors.light.surface,
    padding: 16,
    borderRadius: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
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
  itemCard: {
    flexDirection: 'row',
    marginTop: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  itemQuantity: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  itemTotal: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
});
