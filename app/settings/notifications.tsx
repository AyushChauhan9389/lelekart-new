import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Platform, Switch, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Button } from '@/components/ui/Button';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { api } from '@/utils/api';
import type { NotificationPreferences } from '@/types/api';

const defaultPreferences: NotificationPreferences = {
  orderUpdates: true,
  promotions: true,
  priceAlerts: true,
  stockAlerts: true,
  accountUpdates: true,
  deliveryUpdates: true,
  recommendationAlerts: true,
  paymentReminders: true,
  communicationPreference: 'email',
};

export default function NotificationSettingsScreen() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => createStyles(colors, colorScheme), [colors, colorScheme]);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await api.auth.getNotificationPreferences();
      setPreferences(prefs);
    } catch (err) {
      setError('Failed to load notification preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (key: keyof NotificationPreferences) => (value: boolean) => {
    if (typeof preferences[key] === 'boolean') {
      setPreferences(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.auth.updateNotificationPreferences(preferences);
      setSuccess('Notification preferences updated successfully');
    } catch (err) {
      setError('Failed to update notification preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const settingsItems = [
    { key: 'orderUpdates', label: 'Order Updates' },
    { key: 'promotions', label: 'Promotions & Offers' },
    { key: 'priceAlerts', label: 'Price Alerts' },
    { key: 'stockAlerts', label: 'Stock Alerts' },
    { key: 'accountUpdates', label: 'Account Updates' },
    { key: 'deliveryUpdates', label: 'Delivery Updates' },
    { key: 'recommendationAlerts', label: 'Product Recommendations' },
    { key: 'paymentReminders', label: 'Payment Reminders' },
  ] as const;

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <ThemedText style={styles.headerTitle}>
          Notification Settings
        </ThemedText>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Notification Types</ThemedText>
          {settingsItems.map(({ key, label }) => (
            <View key={key} style={[styles.settingItem, { borderBottomColor: colors.border }]}>
              <ThemedText>{label}</ThemedText>
              <Switch
                value={preferences[key]}
                onValueChange={handleToggle(key)}
                trackColor={{ false: colorScheme === 'dark' ? `${colors.border}80` : colors.border, true: colors.primary }}
                thumbColor={colors.background}
              />
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Communication Preference</ThemedText>
          <View style={styles.communicationButtons}>
            {['email', 'sms', 'push'].map((method) => (
              <Button
                key={method}
                variant={preferences.communicationPreference === method ? 'primary' : 'ghost'}
                onPress={() => setPreferences(prev => ({ ...prev, communicationPreference: method as any }))}
                style={styles.methodButton}
              >
                {method.toUpperCase()}
              </Button>
            ))}
          </View>
        </View>

        {error ? (
          <ThemedText style={[styles.message, { color: colors.error }]}>{error}</ThemedText>
        ) : null}

        {success ? (
          <ThemedText style={[styles.message, { color: colors.success }]}>{success}</ThemedText>
        ) : null}

        <Button
          onPress={handleSave}
          disabled={isLoading || isSaving}
          style={styles.saveButton}
        >
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </ScrollView>
    </ThemedView>
  );
}

const createStyles = (colors: typeof Colors.light, colorScheme: 'light' | 'dark' | null) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: 16,
      paddingBottom: 16,
      paddingTop: Platform.OS === 'ios' ? 60 : 40,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
      ...Platform.select({
        ios: {
          shadowColor: colorScheme === 'dark' ? colors.background : colors.text,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: colorScheme === 'dark' ? 0.3 : 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: 'white',
    },
    content: {
      flex: 1,
    },
    section: {
      padding: 16,
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 16,
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    communicationButtons: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
    },
    methodButton: {
      flex: 1,
    },
    message: {
      textAlign: 'center',
      marginVertical: 16,
      paddingHorizontal: 16,
    },
    saveButton: {
      margin: 16,
    },
  });
