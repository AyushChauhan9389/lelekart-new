import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator, Alert, Pressable, Switch, TouchableOpacity, Platform } from 'react-native'; // Import Switch
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import { NavigationHeader } from '@/components/ui/NavigationHeader';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/utils/api';
import type { Address, CartItem, CreateOrderRequest, WalletSettings } from '@/types/api'; // Import WalletSettings
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
  const [walletCoinBalance, setWalletCoinBalance] = useState(0); // Renamed for clarity
  const [walletSettings, setWalletSettings] = useState<WalletSettings | null>(null);
  const [useWalletCoins, setUseWalletCoins] = useState(false); // State for checkbox/switch
  const [calculatedDiscount, setCalculatedDiscount] = useState(0);
  const [calculatedCoinsToUse, setCalculatedCoinsToUse] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<'cod' | 'razorpay'>('cod');

  const subtotal = useMemo(() =>
    cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0),
    [cartItems]
  );

  const SHIPPING_COST = 0; // Assuming free shipping for now
  const totalBeforeWallet = subtotal + SHIPPING_COST; // Total before applying wallet discount

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setIsLoading(false);
        router.replace('/(auth)/login'); // Redirect if not logged in
        return;
      }
      setIsLoading(true); // Ensure loading state is true at the start
      try {
        // Fetch cart, addresses, wallet details, and wallet settings concurrently
        const [cartResponse, addressesResponse, walletDetailsResponse, walletSettingsResponse] = await Promise.all([
          api.cart.getItems(),
          api.addresses.getAll(),
          api.wallet.getDetails(),
          api.wallet.getSettings() // Fetch wallet settings
        ]);

        setCartItems(cartResponse);
        setAddresses(addressesResponse);
        setWalletCoinBalance(walletDetailsResponse.balance); // Corrected: Use 'balance' field for coin count
        setWalletSettings(walletSettingsResponse); // Store wallet settings

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
  }, [user]);

  // Calculate potential wallet discount when relevant data changes
  useEffect(() => {
    console.log('Recalculating discount. Settings:', walletSettings, 'Balance:', walletCoinBalance, 'Subtotal:', subtotal);

    let newDiscount = 0;
    let newCoinsToUse = 0;
    let discountApplicable = false;

    // Perform checks and calculations only if data is valid
    if (walletSettings && walletCoinBalance > 0 && subtotal > 0) {
        const minCartValue = parseFloat(walletSettings.minCartValue || '0');
        const coinRatio = parseFloat(walletSettings.coinToCurrencyRatio);
        const maxUsagePercent = parseFloat(walletSettings.maxUsagePercentage);

        // Check validity of settings and minimum cart value
        if (subtotal >= minCartValue && !isNaN(coinRatio) && coinRatio > 0 && !isNaN(maxUsagePercent) && maxUsagePercent >= 0) {
            const maxDiscountFromPercentage = subtotal * (maxUsagePercent / 100);
            const maxCoinsFromPercentage = Math.floor(maxDiscountFromPercentage / coinRatio);

            const maxApplicableCoins = Math.min(
              walletCoinBalance,
              walletSettings.maxRedeemableCoins,
              maxCoinsFromPercentage > 0 ? maxCoinsFromPercentage : 0
            );

            const actualDiscount = maxApplicableCoins * coinRatio;
            const roundedDiscount = Math.round(actualDiscount * 100) / 100;

            if (roundedDiscount > 0 && maxApplicableCoins > 0) {
                newDiscount = roundedDiscount;
                newCoinsToUse = maxApplicableCoins;
                discountApplicable = true;
                console.log(`Calculation successful: Discount=${newDiscount}, Coins=${newCoinsToUse}`);
            } else {
                 console.log('Calculation resulted in zero discount/coins.');
            }
        } else {
             console.log(`Calculation skipped: Subtotal ${subtotal} < minCartValue ${minCartValue} or invalid settings.`);
        }
    } else {
        console.log('Calculation skipped: Missing settings, balance, or subtotal.');
    }

    // Update state *outside* the conditional logic if values changed
    if (calculatedDiscount !== newDiscount || calculatedCoinsToUse !== newCoinsToUse) {
        console.log(`Updating state: Discount=${newDiscount}, Coins=${newCoinsToUse}`);
        setCalculatedDiscount(newDiscount);
        setCalculatedCoinsToUse(newCoinsToUse);
    }

    // Reset the toggle *only* if the discount is no longer applicable
    if (!discountApplicable && useWalletCoins) {
        console.log('Resetting useWalletCoins toggle because discount is no longer applicable.');
        setUseWalletCoins(false);
    }

  // Dependencies: Recalculate whenever these primary inputs change.
  // Also include useWalletCoins to handle the reset logic correctly.
  }, [walletSettings, walletCoinBalance, subtotal, useWalletCoins, calculatedDiscount, calculatedCoinsToUse]);


  const handleAddAddress = () => {
    router.push('/addresses');
  };

  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
  };

  // Toggle using wallet coins
  const toggleUseWallet = (value: boolean) => {
    if (calculatedDiscount > 0) { // Only allow toggle if there's a potential discount
      setUseWalletCoins(value);
    }
  };


  const handleCheckout = async () => {
    if (!selectedAddress) {
      Alert.alert('Error', 'Please select a delivery address');
      return;
    }

    setIsProcessing(true);
    try {
      let paymentId: string | null = null;
      let orderId: string | null = null;

      // Determine final total and wallet details for the order payload
      const finalTotal = useWalletCoins ? totalBeforeWallet - calculatedDiscount : totalBeforeWallet;
      const walletDiscountForPayload = useWalletCoins ? calculatedDiscount : undefined;
      const walletCoinsUsedForPayload = useWalletCoins ? calculatedCoinsToUse : undefined;

      if (selectedPayment === 'razorpay') {
        // Ensure finalTotal is not negative if discount somehow exceeds total
        const paymentAmount = Math.max(0, finalTotal);
        if (paymentAmount > 0) {
          const paymentOrder = await api.payment.createOrder(paymentAmount);
          // TODO: Integrate Razorpay SDK here
          // For now, simulate success
          const simulatedId = Math.random().toString(36).substring(7);
          paymentId = `simulated_${simulatedId}`;
          orderId = simulatedId;
          Alert.alert("Simulated Payment", `Razorpay Order ID: ${orderId}\nPayment ID: ${paymentId}`);
        } else {
          // Handle case where total is 0 or less after discount (free order)
          paymentId = 'free_order';
          orderId = `free_${Date.now()}`;
        }
        const simulatedId = Math.random().toString(36).substring(7);
        paymentId = `simulated_${simulatedId}`;
        orderId = simulatedId;
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
        total: Math.max(0, finalTotal), // Ensure total is not negative
        status: 'pending',
        paymentMethod: selectedPayment,
        paymentId: paymentId || undefined, // Use the generated/simulated paymentId
        orderId: orderId || undefined, // Use the generated/simulated orderId
        shippingDetails: shippingDetailsStr,
        walletDiscount: walletDiscountForPayload, // Add wallet discount if used
        walletCoinsUsed: walletCoinsUsedForPayload, // Add coins used if applicable
        addressId: selectedAddress.id // Include addressId if available
      };

      const createdOrder = await api.orders.create(orderData);

      // If wallet coins were used, attempt to redeem them
      if (useWalletCoins && calculatedCoinsToUse > 0 && createdOrder?.id) {
        try {
          await api.wallet.redeem(
            calculatedCoinsToUse,
            'ORDER',
            String(createdOrder.id),
            `Used for order #${createdOrder.id}`
          );
          console.log(`Successfully redeemed ${calculatedCoinsToUse} coins for order ${createdOrder.id}`);
        } catch (redeemError) {
          // Log the error but proceed as per requirement (don't block user flow)
          console.error(`Failed to redeem coins for order ${createdOrder.id}:`, redeemError);
          // Optionally: Alert the user or log for backend reconciliation
          // Alert.alert('Wallet Update Issue', 'Could not update wallet balance. Please contact support if needed.');
        }
      }

      // TODO: Consider clearing the cart after successful order placement
      // Example: await api.cart.clearCart(); (if function exists)

      router.replace(`/orders/${createdOrder.id}`);

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
      <NavigationHeader title="Checkout" />
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
            {/* Conditionally show wallet discount */}
            {useWalletCoins && calculatedDiscount > 0 && (
              <View style={styles.costRow}>
                <ThemedText>Wallet Discount ({calculatedCoinsToUse} Coins)</ThemedText>
                <ThemedText style={[styles.discount, { color: colors.success }]}>
                  -₹{calculatedDiscount.toFixed(2)}
                </ThemedText>
              </View>
            )}
            <View style={[styles.costRow, styles.totalRow, { borderTopColor: colors.border }]}>
              <ThemedText type="title">Total</ThemedText>
              <ThemedText type="title" style={[styles.totalAmount, { color: colors.primary }]}>
                ₹{(useWalletCoins ? totalBeforeWallet - calculatedDiscount : totalBeforeWallet).toFixed(2)}
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

        {/* Wallet Section - Show if settings are loaded */}
        {walletSettings && ( // Check settings are loaded, show section regardless of balance > 0
          <View style={styles.section}>
            <ThemedText type="title" style={styles.sectionTitle}>LeLeKart Wallet</ThemedText>
            <ThemedText>Available Coin Balance: {walletCoinBalance}</ThemedText> {/* Display balance even if 0 */}

            {/* Show interaction container if user has coins */}
            {walletCoinBalance > 0 ? (
              <View style={styles.walletToggleContainer}>
                <ThemedText style={styles.walletToggleLabel}>
                  {calculatedDiscount > 0
                    ? `Apply Discount (-₹${calculatedDiscount.toFixed(2)} using ${calculatedCoinsToUse} coins)`
                    : subtotal < parseFloat(walletSettings?.minCartValue || '0') // Check minCartValue here for label
                      ? `Min cart ₹${walletSettings?.minCartValue} needed`
                      : 'Discount not applicable (check limits)'}
                </ThemedText>
                <Switch
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={useWalletCoins && calculatedDiscount > 0 ? colors.background : colors.surface}
                  ios_backgroundColor={colors.border}
                  onValueChange={toggleUseWallet}
                  value={useWalletCoins && calculatedDiscount > 0} // Visually ON only if toggled AND discount > 0
                  disabled={calculatedDiscount <= 0} // Disable if no actual discount calculated
                />
              </View>
            ) : (
              // Only show text if balance is 0
              <ThemedText style={styles.noDiscountText}>
                You have no coins available.
              </ThemedText>
            )}
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
  headerButton: {
    marginLeft: 8,
    padding: 8,
  },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollView: {
      flex: 1,
      marginTop: Platform.OS === 'ios' ? 0 : 20, // Add margin for Android status bar
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
    walletToggleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 12,
      paddingVertical: 8,
    },
    walletToggleLabel: {
      flex: 1,
      marginRight: 12,
      fontSize: 15,
    },
    noDiscountText: {
      marginTop: 8,
      fontSize: 14,
      opacity: 0.7,
      fontStyle: 'italic',
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
