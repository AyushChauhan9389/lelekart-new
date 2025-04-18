import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator, Alert, Pressable, TextInput, TouchableOpacity, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/utils/api';
import type { Address, CartItem, CreateOrderRequest } from '@/types/api';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function CheckoutScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => createStyles(colors, colorScheme), [colors, colorScheme]);

  const [isLoading, setIsLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [coinsToUse, setCoinsToUse] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<'cod' | 'razorpay'>('cod');

  const subtotal = useMemo(() =>
    cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0),
    [cartItems]
  );

  const SHIPPING_COST = 40;
  const totalBeforeDiscount = subtotal + SHIPPING_COST;

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setIsLoading(false);
        router.replace('/(auth)/login'); // Redirect if not logged in
        return;
      }
      try {
        const [cartResponse, addressesResponse, walletResponse] = await Promise.all([
          api.cart.getItems(),
          api.addresses.getAll(),
          api.wallet.getDetails()
        ]);

        setCartItems(cartResponse);
        setAddresses(addressesResponse);
        setWalletBalance(walletResponse.balance);

        const defaultAddress = addressesResponse.find(addr => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddress(defaultAddress);
        } else if (addressesResponse.length > 0) {
          setSelectedAddress(addressesResponse[0]); // Select first if no default
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching checkout data:', error);
        Alert.alert('Error', 'Failed to load checkout information. Please try again.');
        router.back();
      }
    };

    fetchData();
  }, [user]); // Depend on user

  const handleAddAddress = () => {
    router.push('/addresses');
  };

  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
  };

  const handleCoinsChange = async (coins: number) => {
    const numericCoins = Math.max(0, Math.floor(coins)); // Ensure positive integer
    if (numericCoins > walletBalance) {
      setCoinsToUse(walletBalance); // Cap at available balance
      return;
    }
    
    try {
      const validation = await api.wallet.validateRedemption(
        totalBeforeDiscount,
        numericCoins,
        cartItems.map(item => item.product.category)
      );

      if (validation.valid) {
        setCoinsToUse(validation.coinsApplicable);
      } else {
        Alert.alert('Invalid', validation.message);
        setCoinsToUse(0);
      }
    } catch (error) {
      console.error('Error validating coins:', error);
      Alert.alert('Error', 'Failed to validate wallet coins. Please try again.');
    }
  };

  const handleCheckout = async () => {
    if (!selectedAddress) {
      Alert.alert('Error', 'Please select a delivery address');
      return;
    }

    setIsProcessing(true);
    try {
      let paymentId = null;
      let orderId = null;

      if (selectedPayment === 'razorpay') {
        const paymentOrder = await api.payment.createOrder(totalBeforeDiscount - coinsToUse);
        // TODO: Integrate Razorpay SDK here
        // For now, simulate success
        paymentId = `simulated_${paymentOrder.id}`;
        orderId = paymentOrder.id;
        Alert.alert("Simulated Payment", `Razorpay Order ID: ${orderId}\nPayment ID: ${paymentId}`);
      }

      const shippingDetailsStr = JSON.stringify({
        name: selectedAddress.fullName,
        email: user?.email || '',
        phone: selectedAddress.phone,
        address: selectedAddress.address,
        city: selectedAddress.city,
        state: selectedAddress.state,
        zipCode: selectedAddress.pincode,
        notes: ''
      });

      const orderData: CreateOrderRequest = {
        userId: user?.id || 0,
        total: totalBeforeDiscount - coinsToUse,
        status: 'pending',
        paymentMethod: selectedPayment,
        paymentId: paymentId || undefined,
        orderId: orderId || undefined,
        shippingDetails: shippingDetailsStr
        // walletCoinsUsed is not part of CreateOrderRequest
        // items are likely derived server-side from the cart based on userId
      };

      const order = await api.orders.create(orderData);
      // await api.cart.clearCart(); // Removed as function doesn't exist in context
      router.replace(`/orders/${order.id}`);

    } catch (error: any) {
      console.error('Checkout error:', error);
      Alert.alert('Error', error?.message || 'Failed to process checkout. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <ThemedText type="title" style={styles.sectionTitle}>Delivery Address</ThemedText>
          {addresses.length === 0 ? (
            <Button onPress={handleAddAddress}>Manage Addresses</Button>
          ) : (
            <View>
              {addresses.map(address => (
                <Pressable
                  key={address.id}
                  onPress={() => handleAddressSelect(address)}
                  style={[
                    styles.addressCard,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    selectedAddress?.id === address.id && [styles.selectedAddress, { borderColor: colors.primary }]
                  ]}
                >
                  <ThemedText style={styles.addressName}>{address.addressName}</ThemedText>
                  <ThemedText style={styles.fullName}>{address.fullName}</ThemedText>
                  <ThemedText style={styles.addressText}>{address.address}</ThemedText>
                  <ThemedText style={styles.addressText}>{address.city}, {address.state}</ThemedText>
                  <ThemedText style={[styles.pincode, { color: colors.textSecondary }]}>PIN Code: {address.pincode}</ThemedText>
                  <ThemedText style={[styles.phone, { color: colors.textSecondary }]}>Phone: {address.phone}</ThemedText>
                </Pressable>
              ))}
              <Button
                variant="outline"
                style={styles.addAddressButton}
                onPress={handleAddAddress}
              >
                Add New Address
              </Button>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <ThemedText type="title" style={styles.sectionTitle}>Order Summary</ThemedText>
          {cartItems.map(item => (
            <View key={item.id} style={styles.orderItem}>
              <ThemedText style={styles.itemName}>
                {item.product.name} × {item.quantity}
              </ThemedText>
              <ThemedText style={styles.itemPrice}>
                ₹{item.product.price * item.quantity}
              </ThemedText>
            </View>
          ))}
          <View style={[styles.costBreakdown, { backgroundColor: colors.surface }]}>
            <View style={styles.costRow}>
              <ThemedText>Subtotal</ThemedText>
              <ThemedText>₹{subtotal}</ThemedText>
            </View>
            <View style={styles.costRow}>
              <ThemedText>Shipping</ThemedText>
              <ThemedText>₹{SHIPPING_COST}</ThemedText>
            </View>
            {coinsToUse > 0 && (
              <View style={styles.costRow}>
                <ThemedText>Wallet Discount</ThemedText>
                <ThemedText style={[styles.discount, { color: colors.success }]}>-₹{coinsToUse}</ThemedText>
              </View>
            )}
            <View style={[styles.costRow, styles.totalRow, { borderTopColor: colors.border }]}>
              <ThemedText type="title">Total</ThemedText>
              <ThemedText type="title" style={[styles.totalAmount, { color: colors.primary }]}>
                ₹{totalBeforeDiscount - coinsToUse}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="title" style={styles.sectionTitle}>Payment Method</ThemedText>
          <View style={[styles.paymentOptions, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={[
                styles.paymentOption,
                { borderBottomColor: colors.border },
                selectedPayment === 'cod' && [styles.selectedPayment, { backgroundColor: colors.background }]
              ]}
              onPress={() => setSelectedPayment('cod')}
            >
              <ThemedText style={styles.paymentText}>Cash on Delivery</ThemedText>
              {selectedPayment === 'cod' && (
                <View style={[styles.radioSelected, { backgroundColor: colors.primary }]} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                { borderBottomWidth: 0 }, // No border for the last item
                selectedPayment === 'razorpay' && [styles.selectedPayment, { backgroundColor: colors.background }]
              ]}
              onPress={() => setSelectedPayment('razorpay')}
            >
              <ThemedText style={styles.paymentText}>Pay Online (Razorpay)</ThemedText>
              {selectedPayment === 'razorpay' && (
                <View style={[styles.radioSelected, { backgroundColor: colors.primary }]} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {walletBalance > 0 && (
          <View style={styles.section}>
            <ThemedText type="title" style={styles.sectionTitle}>LeLeKart Wallet</ThemedText>
            <ThemedText>Available Balance: ₹{walletBalance}</ThemedText>
            <View style={styles.walletInput}>
              <ThemedText>Use Coins:</ThemedText>
              <TextInput
                style={[styles.coinsInput, { borderColor: colors.border, color: colors.text }]}
                keyboardType="number-pad"
                value={String(coinsToUse)}
                onChangeText={(text) => handleCoinsChange(Number(text) || 0)}
                maxLength={5}
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <Button
          fullWidth
          onPress={handleCheckout}
          disabled={isProcessing || !selectedAddress}
        >
          {isProcessing ? 'Processing...' : 'Place Order'}
        </Button>
      </View>
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
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 100, // Space for footer
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      marginBottom: 16,
    },
    addressCard: {
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: StyleSheet.hairlineWidth,
    },
    selectedAddress: {
      borderWidth: 2,
    },
    addressName: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    fullName: {
      fontSize: 15,
      fontWeight: '500',
      marginBottom: 4,
    },
    addressText: {
      fontSize: 14,
      marginBottom: 2,
      opacity: colorScheme === 'dark' ? 0.7 : 0.8,
    },
    pincode: {
      fontSize: 14,
      marginTop: 2,
    },
    phone: {
      fontSize: 14,
      marginTop: 4,
    },
    addAddressButton: {
      marginTop: 12,
    },
    orderItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    itemName: {
      flex: 1,
      marginRight: 16,
    },
    itemPrice: {
      fontWeight: '600',
    },
    costBreakdown: {
      marginTop: 16,
      padding: 16,
      borderRadius: 12,
    },
    costRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    totalRow: {
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    discount: {
      fontWeight: '500',
    },
    totalAmount: {
      fontSize: 20,
    },
    paymentOptions: {
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    paymentOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    selectedPayment: {
      // Background applied inline
    },
    paymentText: {
      fontSize: 16,
    },
    radioSelected: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    walletInput: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
    },
    coinsInput: {
      marginLeft: 12,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      minWidth: 80,
      fontSize: 16,
    },
    footer: {
      padding: 16,
      paddingBottom: 32, // Adjust for safe area if needed
      borderTopWidth: StyleSheet.hairlineWidth,
      ...Platform.select({
        ios: {
          shadowColor: colorScheme === 'dark' ? colors.background : colors.text,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: colorScheme === 'dark' ? 0.3 : 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 5,
        },
      }),
    },
  });
