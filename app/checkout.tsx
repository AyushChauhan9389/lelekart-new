import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator, Alert, Pressable, TextInput, TouchableOpacity } from 'react-native';
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
  
  const [isLoading, setIsLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [coinsToUse, setCoinsToUse] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<'cod' | 'razorpay'>('cod');

  // Calculate totals
  const subtotal = useMemo(() => 
    cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0),
    [cartItems]
  );
  
  const SHIPPING_COST = 40;
  const totalBeforeDiscount = subtotal + SHIPPING_COST;

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cartResponse, addressesResponse, walletResponse] = await Promise.all([
          api.cart.getItems(),
          api.addresses.getAll(),
          api.wallet.getDetails()
        ]);

        setCartItems(cartResponse);
        setAddresses(addressesResponse);
        setWalletBalance(walletResponse.balance);
        
        // Set default address if available
        const defaultAddress = addressesResponse.find(addr => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddress(defaultAddress);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching checkout data:', error);
        Alert.alert('Error', 'Failed to load checkout information. Please try again.');
        router.back();
      }
    };

    fetchData();
  }, []);

  const handleAddAddress = () => {
    // Navigate to addresses screen
    router.push('/addresses');
  };

  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
  };

  const handleCoinsChange = async (coins: number) => {
    if (coins > walletBalance) return;
    
    try {
      const validation = await api.wallet.validateRedemption(
        totalBeforeDiscount,
        coins,
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
        // Create Razorpay order
        const paymentOrder = await api.payment.createOrder(totalBeforeDiscount - coinsToUse);

        // TODO: Initialize Razorpay payment
        const razorpay = {
          key: paymentOrder.key,
          amount: paymentOrder.amount,
          currency: "INR",
          name: "LeLeKart",
          description: "Purchase from LeLeKart",
          order_id: paymentOrder.id,
          prefill: {
            name: user?.name,
            email: user?.email,
            contact: user?.phone
          },
          theme: { color: colors.primary }
        };

        // Initialize Razorpay and wait for payment
        paymentId = 'dummy_payment_id'; // This would come from Razorpay
        orderId = paymentOrder.id;
      }

      // Create order with proper API format
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

      // Create order with shipping details and proper API format
      const orderData = {
        userId: user?.id || 0,
        total: totalBeforeDiscount - coinsToUse,
        status: 'pending',
        paymentMethod: selectedPayment,
        paymentId: paymentId || undefined,
        orderId: orderId || undefined,
        shippingDetails: shippingDetailsStr
      };

      const order = await api.orders.create(orderData);

      // Navigate to order success page
      router.push(`/orders/${order.id}`);
    } catch (error) {
      console.error('Checkout error:', error);
      Alert.alert('Error', 'Failed to process checkout. Please try again.');
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
        {/* Addresses Section */}
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
                    selectedAddress?.id === address.id && styles.selectedAddress
                  ]}
                >
                  <ThemedText style={styles.addressName}>{address.addressName}</ThemedText>
                  <ThemedText style={styles.fullName}>{address.fullName}</ThemedText>
                  <ThemedText style={styles.addressText}>{address.address}</ThemedText>
                  <ThemedText style={styles.addressText}>{address.city}, {address.state}</ThemedText>
                  <ThemedText style={styles.pincode}>PIN Code: {address.pincode}</ThemedText>
                  <ThemedText style={styles.phone}>Phone: {address.phone}</ThemedText>
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

        {/* Order Summary */}
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
          <View style={styles.costBreakdown}>
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
                <ThemedText style={styles.discount}>-₹{coinsToUse}</ThemedText>
              </View>
            )}
            <View style={[styles.costRow, styles.totalRow]}>
              <ThemedText type="title">Total</ThemedText>
              <ThemedText type="title" style={styles.totalAmount}>
                ₹{totalBeforeDiscount - coinsToUse}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Payment Method Section */}
        <View style={styles.section}>
          <ThemedText type="title" style={styles.sectionTitle}>Payment Method</ThemedText>
          <View style={styles.paymentOptions}>
            <TouchableOpacity 
              style={[
                styles.paymentOption,
                selectedPayment === 'cod' && styles.selectedPayment
              ]}
              onPress={() => setSelectedPayment('cod')}
            >
              <ThemedText style={styles.paymentText}>Cash on Delivery</ThemedText>
              {selectedPayment === 'cod' && (
                <View style={styles.radioSelected} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.paymentOption,
                selectedPayment === 'razorpay' && styles.selectedPayment
              ]}
              onPress={() => setSelectedPayment('razorpay')}
            >
              <ThemedText style={styles.paymentText}>Pay Online (Razorpay)</ThemedText>
              {selectedPayment === 'razorpay' && (
                <View style={styles.radioSelected} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Wallet Section */}
        {walletBalance > 0 && (
          <View style={styles.section}>
            <ThemedText type="title" style={styles.sectionTitle}>LeLeKart Wallet</ThemedText>
            <ThemedText>Available Balance: ₹{walletBalance}</ThemedText>
            <View style={styles.walletInput}>
              <ThemedText>Use Coins:</ThemedText>
              <TextInput
                style={styles.coinsInput}
                keyboardType="number-pad"
                value={String(coinsToUse)}
                onChangeText={(text) => handleCoinsChange(Number(text) || 0)}
                maxLength={5}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Checkout Button */}
      <View style={styles.footer}>
        <Button
          fullWidth
          onPress={handleCheckout}
          disabled={isProcessing || !selectedAddress}
        >
          Place Order
        </Button>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  paymentOptions: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  selectedPayment: {
    backgroundColor: Colors.light.background,
  },
  paymentText: {
    fontSize: 16,
  },
  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.light.primary,
  },
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
    backgroundColor: Colors.light.background,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.light.border,
  },
  selectedAddress: {
    borderColor: Colors.light.primary,
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
  },
  pincode: {
    fontSize: 14,
    marginTop: 2,
    color: Colors.light.textSecondary,
  },
  phone: {
    fontSize: 14,
    marginTop: 4,
    color: Colors.light.textSecondary,
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
    backgroundColor: Colors.light.surface,
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
    borderTopColor: Colors.light.border,
  },
  discount: {
    color: Colors.light.success,
  },
  totalAmount: {
    color: Colors.light.primary,
    fontSize: 20,
  },
  walletInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  coinsInput: {
    marginLeft: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 80,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
});
