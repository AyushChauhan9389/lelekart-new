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
import { useFocusEffect } from 'expo-router';

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
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <ThemedText type="title" style={styles.headerTitle}>
          All Categories
        </ThemedText>
      </View>
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
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
});
