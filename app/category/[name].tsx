import React, { useEffect, useState, useMemo } from 'react';
import { ScrollView, StyleSheet, View, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ProductGrid } from '@/components/home/ProductGrid';
import { api } from '@/utils/api';
import type { Product } from '@/types/api';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function CategoryScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => createStyles(colors, colorScheme), [colors, colorScheme]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!name) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.products.getByCategory(name);
        if (response.products) {
          setProducts(response.products);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error('Error fetching category products:', err);
        setError('Failed to load products. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [name]);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: name ? decodeURIComponent(name) : 'Category',
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.background,
            ...Platform.select({
              ios: {
                shadowColor: colorScheme === 'dark' ? colors.background : colors.text,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: colorScheme === 'dark' ? 0.3 : 0.1,
                shadowRadius: 4,
              },
              android: {
                elevation: 4,
              },
            }),
          },
          headerShadowVisible: true,
          headerTintColor: colors.text,
          headerTitleStyle: {
            color: colors.text,
          },
          headerTitleAlign: 'center',
        }}
      />
      {isLoading ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centeredContainer}>
          <ThemedText style={[styles.errorText, { color: colors.error }]}>
            {error}
          </ThemedText>
        </View>
      ) : products.length > 0 ? (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content}
        >
          <ProductGrid data={products} />
        </ScrollView>
      ) : (
        <View style={styles.centeredContainer}>
          <ThemedText style={styles.emptyText}>
            No products found in this category.
          </ThemedText>
        </View>
      )}
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
    content: {
      paddingVertical: 16,
    },
    centeredContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      textAlign: 'center',
      fontSize: 16,
      opacity: colorScheme === 'dark' ? 0.8 : 1,
    },
    emptyText: {
      textAlign: 'center',
      fontSize: 16,
      opacity: colorScheme === 'dark' ? 0.5 : 0.7,
    },
  });
