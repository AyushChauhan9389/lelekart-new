import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, FlatList } from 'react-native';
import { Stack, router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/context/AuthContext';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { api } from '@/utils/api';
import type { Wallet, WalletTransaction, WalletSettings } from '@/types/api';
import { format } from 'date-fns'; // For formatting dates

export default function WalletScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [walletDetails, setWalletDetails] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [settings, setSettings] = useState<WalletSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/login'); // Redirect if not logged in
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [details, transactionsData, settingsData] = await Promise.all([
          api.wallet.getDetails(),
          api.wallet.getTransactions(),
          api.wallet.getSettings(),
        ]);
        setWalletDetails(details);
        setTransactions(transactionsData.transactions);
        setSettings(settingsData);
      } catch (error) {
        console.error('Error fetching wallet data:', error);
        // Handle error (e.g., show toast)
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const renderTransactionItem = ({ item }: { item: WalletTransaction }) => (
    <View style={[styles.transactionItem, { borderBottomColor: colors.border }]}>
      <View style={styles.transactionDetails}>
        <ThemedText style={styles.transactionDescription}>{item.description}</ThemedText>
        <ThemedText style={styles.transactionDate}>
          {format(new Date(item.createdAt), 'MMM d, yyyy h:mm a')}
        </ThemedText>
      </View>
      <ThemedText style={[
        styles.transactionAmount,
        item.type === 'credit' ? styles.creditAmount : styles.debitAmount,
        { color: item.type === 'credit' ? colors.success : colors.error }
      ]}>
        {item.type === 'credit' ? '+' : '-'}₹{item.amount.toFixed(2)}
      </ThemedText>
    </View>
  );

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Removed inline Stack.Screen options */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Balance Section */}
        <View style={[styles.section, styles.balanceSection, { backgroundColor: colors.primary }]}>
          <ThemedText style={styles.balanceLabel}>Current Balance</ThemedText>
          <ThemedText style={styles.balanceAmount}>₹{walletDetails?.balance?.toFixed(2) ?? '0.00'}</ThemedText>
          {/* Add lifetime stats if available in Wallet type */}
          {/* <ThemedText style={styles.lifetimeStats}>
            Lifetime Earned: ₹{walletDetails?.lifetimeEarned?.toFixed(2) ?? '0.00'} | Redeemed: ₹{walletDetails?.lifetimeRedeemed?.toFixed(2) ?? '0.00'}
          </ThemedText> */}
        </View>

        {/* Transactions Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Recent Transactions</ThemedText>
          <FlatList
            data={transactions}
            renderItem={renderTransactionItem}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false} // Disable scroll as it's inside ScrollView
            ListEmptyComponent={<ThemedText style={styles.emptyText}>No transactions yet.</ThemedText>}
          />
        </View>

        {/* Settings Overview Section */}
        {settings && (
          <View style={[styles.section, styles.settingsSection, { backgroundColor: colors.card }]}>
            <ThemedText style={styles.sectionTitle}>Wallet Settings</ThemedText>
            <View style={styles.settingItem}>
              <ThemedText style={styles.settingLabel}>Coin Value:</ThemedText>
              <ThemedText style={styles.settingValue}>1 Coin = ₹{settings.coinToCurrencyRatio}</ThemedText>
            </View>
            <View style={styles.settingItem}>
              <ThemedText style={styles.settingLabel}>Max Redeemable Coins:</ThemedText>
              <ThemedText style={styles.settingValue}>{settings.maxRedeemableCoins}</ThemedText>
            </View>
            <View style={styles.settingItem}>
              <ThemedText style={styles.settingLabel}>Max Usage Per Order:</ThemedText>
              <ThemedText style={styles.settingValue}>{settings.maxUsagePercentage}%</ThemedText>
            </View>
            <View style={styles.settingItem}>
              <ThemedText style={styles.settingLabel}>Coin Expiry:</ThemedText>
              <ThemedText style={styles.settingValue}>{settings.coinExpiryDays} days</ThemedText>
            </View>
            {/* Add more settings as needed */}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  balanceSection: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    color: colors.background, // White text on primary background
    opacity: 0.8,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.background,
    lineHeight: 44, // Add lineHeight to prevent cutoff
  },
  lifetimeStats: {
    fontSize: 12,
    color: colors.background,
    opacity: 0.7,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  transactionDetails: {
    flex: 1,
    marginRight: 10,
  },
  transactionDescription: {
    fontSize: 14,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  creditAmount: {
    // color: colors.success, // Set dynamically
  },
  debitAmount: {
    // color: colors.error, // Set dynamically
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 10,
    color: colors.textSecondary,
  },
  settingsSection: {
    padding: 16,
    borderRadius: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  settingValue: {
    fontSize: 14,
    fontWeight: '500',
  },
});
