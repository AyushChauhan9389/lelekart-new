import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import type { Category } from '@/types/api';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { CategoryList } from '@/components/home/CategoryList';
import { api } from '@/utils/api';
import { useState, useCallback } from 'react';
import { useFocusEffect, Stack } from 'expo-router'; // Import Stack
import { NavigationHeader } from '@/components/ui/NavigationHeader'; // Import NavigationHeader

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const fetchCategories = async () => {
    try {
      const data = await api.home.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCategories();
    }, [])
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <NavigationHeader title="All Categories" />
      <ScrollView>
        <CategoryList data={categories} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Removed header and headerTitle styles
});
