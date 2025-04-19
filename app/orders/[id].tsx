import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator, RefreshControl, Platform, Image } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { NavigationHeader } from '@/components/ui/NavigationHeader';
import { MapPin, Package, Truck, Clock, Calendar, CreditCard } from 'lucide-react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { api } from '@/utils/api';
import type { Order, OrderItem } from '@/types/api';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

type TrackingInfo = {
  trackingId?: string;
  courier?: string;
  courierUrl?: string;
  status?: string;
  statusTimeline?: {
    status: string;
    timestamp: string;
    description: string;
  }[];
  estimatedDelivery?: string;
  currentLocation?: string;
  lastUpdated?: string;
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState<TrackingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => createStyles(colors, colorScheme), [colors, colorScheme]);

  const fetchOrderDetails = useCallback(async () => {
    if (!id) {
      setError('No Order ID provided');
      setIsLoading(false);
      return;
    }

    if (isNaN(Number(id))) {
      setError('Invalid Order ID');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      setError(null);
      const orderId = Number(id);
      const [orderData, trackingData] = await Promise.all([
        api.orders.getOrderById(orderId),
        api.orders.getTracking(orderId).catch(() => null)
      ]);
      setOrder(orderData);
      setTracking(trackingData);
    } catch (err) {
      console.error('Failed to fetch order details:', err);
      setError('Unable to load order details. Please try again.');
      setOrder(null);
      setTracking(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchOrderDetails();
    setIsRefreshing(false);
  }, [fetchOrderDetails]);

  const formatDate = (dateString: string | undefined, includeTime = false) => {
    if (!dateString) return 'N/A';
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...(includeTime && {
        hour: 'numeric',
        minute: 'numeric'
      })
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
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

  const getStatusColor = (status: string | undefined) => {
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

  if (isLoading || error || !order) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <NavigationHeader title={`Order #${id}`} />
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>
              {error || 'Order not found'}
            </ThemedText>
          </View>
        )}
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <NavigationHeader title={`Order #${id}`} />
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <View style={[styles.section, styles.summarySection]}>
          <ThemedText style={styles.orderIdText}>Order #{order.id}</ThemedText>
          <View style={styles.summaryRow}>
            <Calendar size={16} color={colors.textSecondary} />
            <ThemedText style={styles.summaryText}>
              Placed on {formatDate(order.createdAt || order.date)}
            </ThemedText>
          </View>
          <View style={styles.summaryRow}>
            <Package size={16} color={colors.textSecondary} />
            <ThemedText style={[styles.summaryText, styles.statusText, { color: getStatusColor(order.status) }]}>
              {order.status?.toUpperCase() || 'UNKNOWN'}
            </ThemedText>
          </View>
        </View>

        {tracking && (tracking.trackingId || tracking.currentLocation || tracking.statusTimeline?.length) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Truck size={20} color={colors.text} />
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Delivery Status
              </ThemedText>
            </View>
            <View style={styles.trackingInfo}>
              {tracking.trackingId && tracking.courier && (
                <ThemedText style={styles.trackingId}>
                  Tracking ID: {tracking.trackingId} ({tracking.courier})
                </ThemedText>
              )}
              {tracking.currentLocation && (
                <View style={styles.locationInfo}>
                  <MapPin size={16} color={colors.textSecondary} />
                  <ThemedText style={styles.location}>
                    {tracking.currentLocation}
                  </ThemedText>
                </View>
              )}
              {tracking.estimatedDelivery && (
                <View style={styles.deliveryInfo}>
                  <Clock size={16} color={colors.textSecondary} />
                  <ThemedText style={styles.estimatedDelivery}>
                    Estimated delivery by {formatDate(tracking.estimatedDelivery)}
                  </ThemedText>
                </View>
              )}
            </View>
            {tracking.statusTimeline && tracking.statusTimeline.length > 0 && (
              <View style={styles.timeline}>
                {tracking.statusTimeline.map((event, index) => (
                  <View key={index} style={[
                    styles.timelineEvent,
                    index === tracking.statusTimeline!.length - 1 && styles.lastTimelineEvent
                  ]}>
                    <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
                    <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
                    <View style={styles.timelineContent}>
                      <ThemedText style={styles.timelineStatus}>
                        {event.status.replace(/_/g, ' ').toUpperCase()}
                      </ThemedText>
                      <ThemedText style={styles.timelineDescription}>
                        {event.description}
                      </ThemedText>
                      <ThemedText style={styles.timelineDate}>
                        {formatDate(event.timestamp, true)}
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Package size={20} color={colors.text} />
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Order Items ({order.items?.length || 0})
            </ThemedText>
          </View>
          <View style={styles.itemsList}>
            {order.items?.map((item: OrderItem) => (
              <View key={item.id} style={styles.orderItem}>
                {(item.product?.imageUrl || item.product?.image_url) ? (
                  <Image
                    source={{ uri: item.product?.imageUrl || item.product?.image_url }}
                    style={styles.itemImage}
                  />
                ) : (
                  <View style={[styles.itemImage, { backgroundColor: colors.border }]} />
                )}
                <View style={styles.itemDetails}>
                  <ThemedText style={styles.itemName} numberOfLines={2}>
                    {item.product?.name || `Product #${item.productId}`}
                  </ThemedText>
                  <ThemedText style={styles.itemQuantity}>
                    Qty: {item.quantity}
                  </ThemedText>
                </View>
                <ThemedText style={styles.itemPrice}>
                  {formatCurrency(item.price * item.quantity)}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Price Details</ThemedText>
          <View style={[styles.totalSection, { borderTopColor: colors.border }]}>
            <View style={styles.priceRow}>
              <ThemedText style={styles.priceLabel}>Subtotal</ThemedText>
              <ThemedText style={styles.priceValue}>
                {formatCurrency(order.totalAmount ?? order.total)}
              </ThemedText>
            </View>
            {order.discountAmount && order.discountAmount > 0 && (
              <View style={styles.priceRow}>
                <ThemedText style={styles.priceLabel}>Discount</ThemedText>
                <ThemedText style={[styles.priceValue, { color: colors.success }]}>
                  -{formatCurrency(order.discountAmount)}
                </ThemedText>
              </View>
            )}
            {order.walletCoinsUsed && order.walletCoinsUsed > 0 && (
              <View style={styles.priceRow}>
                <ThemedText style={styles.priceLabel}>Coins Used</ThemedText>
                <ThemedText style={[styles.priceValue, { color: colors.success }]}>
                  -{formatCurrency(order.walletCoinsUsed)}
                </ThemedText>
              </View>
            )}
            <View style={[styles.priceRow, styles.finalTotal, { borderTopColor: colors.border }]}>
              <ThemedText style={styles.finalTotalLabel}>
                Total Paid
              </ThemedText>
              <ThemedText style={[styles.finalTotalValue, { color: colors.primary }]}>
                {formatCurrency(order.finalAmount ?? order.total)}
              </ThemedText>
            </View>
          </View>
        </View>

        {order.shippingDetails && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MapPin size={20} color={colors.text} />
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Shipping Address
              </ThemedText>
            </View>
            <View style={styles.addressInfo}>
              <ThemedText style={styles.addressName}>
                {order.shippingDetails.name}
              </ThemedText>
              <ThemedText style={styles.addressText}>
                {order.shippingDetails.address}
              </ThemedText>
              <ThemedText style={styles.addressText}>
                {order.shippingDetails.city}, {order.shippingDetails.state} {order.shippingDetails.zipCode}
              </ThemedText>
              <ThemedText style={styles.addressText}>
                Phone: {order.shippingDetails.phone}
              </ThemedText>
              {order.shippingDetails.notes && (
                <ThemedText style={styles.notes}>
                  Notes: {order.shippingDetails.notes}
                </ThemedText>
              )}
            </View>
          </View>
        )}

        <View style={[styles.section, styles.lastSection]}>
          <View style={styles.sectionHeader}>
            <CreditCard size={20} color={colors.text} />
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Payment Information
            </ThemedText>
          </View>
          <View style={styles.paymentInfo}>
            <ThemedText style={styles.paymentMethod}>
              Method: {order.paymentMethod?.toUpperCase() || 'N/A'}
            </ThemedText>
            {order.paymentId && (
              <ThemedText style={styles.paymentId}>
                Payment ID: {order.paymentId}
              </ThemedText>
            )}
          </View>
        </View>
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
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      textAlign: 'center',
      opacity: colorScheme === 'dark' ? 0.5 : 0.7,
      fontSize: 16,
    },
    section: {
      padding: 16,
      backgroundColor: colors.surface,
      marginBottom: 12,
      ...Platform.select({
        ios: {
          shadowColor: colorScheme === 'dark' ? colors.background : colors.text,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: colorScheme === 'dark' ? 0.3 : 0.05,
          shadowRadius: 4,
        },
        android: {
          elevation: 1,
        },
      }),
    },
    lastSection: {
      marginBottom: 0,
    },
    summarySection: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      marginBottom: 12,
    },
    orderIdText: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 12,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    summaryText: {
      fontSize: 14,
      opacity: colorScheme === 'dark' ? 0.7 : 0.8,
    },
    statusText: {
      fontWeight: '600',
      opacity: 1,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
    },
    trackingInfo: {
      marginBottom: 20,
      gap: 8,
    },
    trackingId: {
      fontWeight: '500',
    },
    locationInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    location: {
      flex: 1,
      opacity: colorScheme === 'dark' ? 0.7 : 0.8,
    },
    deliveryInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    estimatedDelivery: {
      flex: 1,
      opacity: colorScheme === 'dark' ? 0.7 : 0.8,
    },
    timeline: {
      paddingLeft: 6,
    },
    timelineEvent: {
      flexDirection: 'row',
      position: 'relative',
      paddingBottom: 24,
    },
    timelineLine: {
      position: 'absolute',
      left: 5,
      top: 16,
      bottom: -8,
      width: 2,
    },
    lastTimelineEvent: {
      paddingBottom: 0,
    },
    timelineDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 16,
      zIndex: 1,
    },
    timelineContent: {
      flex: 1,
    },
    timelineStatus: {
      fontWeight: '600',
      marginBottom: 4,
      fontSize: 14,
    },
    timelineDescription: {
      marginBottom: 4,
      fontSize: 14,
      opacity: colorScheme === 'dark' ? 0.7 : 0.8,
    },
    timelineDate: {
      fontSize: 12,
      opacity: colorScheme === 'dark' ? 0.5 : 0.6,
    },
    itemsList: {
      gap: 16,
    },
    orderItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    itemImage: {
      width: 60,
      height: 60,
      borderRadius: 8,
    },
    itemDetails: {
      flex: 1,
    },
    itemName: {
      marginBottom: 4,
      fontSize: 15,
    },
    itemQuantity: {
      fontSize: 14,
      opacity: colorScheme === 'dark' ? 0.6 : 0.7,
    },
    itemPrice: {
      fontWeight: '600',
      fontSize: 15,
    },
    totalSection: {
      marginTop: 24,
      paddingTop: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    priceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    priceLabel: {
      opacity: colorScheme === 'dark' ? 0.6 : 0.7,
      fontSize: 14,
    },
    priceValue: {
      fontWeight: '500',
      fontSize: 14,
    },
    finalTotal: {
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    finalTotalLabel: {
      opacity: 1,
      fontWeight: '600',
      fontSize: 16,
    },
    finalTotalValue: {
      fontSize: 18,
      fontWeight: '600',
    },
    addressInfo: {
      gap: 6,
    },
    addressName: {
      fontWeight: '600',
      fontSize: 15,
      marginBottom: 4,
    },
    addressText: {
      opacity: colorScheme === 'dark' ? 0.7 : 0.8,
      fontSize: 14,
      lineHeight: 20,
    },
    notes: {
      marginTop: 8,
      fontStyle: 'italic',
      opacity: colorScheme === 'dark' ? 0.6 : 0.7,
      fontSize: 14,
    },
    paymentInfo: {
      gap: 6,
    },
    paymentMethod: {
      fontWeight: '500',
      fontSize: 15,
    },
    paymentId: {
      opacity: colorScheme === 'dark' ? 0.6 : 0.7,
      fontSize: 14,
    },
  });
