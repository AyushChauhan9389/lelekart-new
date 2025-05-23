import React, { useState, useEffect, useMemo } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Dimensions, Image } from 'react-native';
import { Star } from 'lucide-react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { CategoryProductGrid } from '@/components/home/CategoryProductGrid';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { api } from '@/utils/api';
import type { Category, Product } from '@/types/api';

interface ProductsResponse {
  products: Product[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}

const { width: WINDOW_WIDTH } = Dimensions.get('window');
const isTabletOrLarger = WINDOW_WIDTH >= 768;

export default function CategoriesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => createStyles(colors), [colors]);

  const allCategory: Category = {
    id: 0,
    name: 'All',
    slug: 'all',
    image: 'https://cdn-icons-png.flaticon.com/512/1828/1828884.png', // Solid star icon for "All" category
  };
  const [categories, setCategories] = useState<Category[]>([allCategory]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const fetchedCategories = await api.home.getCategories();
        setCategories([allCategory, ...fetchedCategories]);
        // Select "All" category by default
        setSelectedCategory(allCategory);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Fetch products when selectedCategory changes
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoadingProducts(true);
      try {
        // If "All" is selected or no category is selected, fetch all products
        const response = selectedCategory?.id === 0
          ? await api.products.getAll() as unknown as ProductsResponse
          : await api.products.getByCategory(selectedCategory!.name) as unknown as ProductsResponse;
        setProducts(response.products);
      } catch (error) {
        console.error(`Error fetching products for category ${selectedCategory?.name}:`, error);
        setProducts([]);
      } finally {
        setIsLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [selectedCategory]);

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory?.id === item.id && styles.categoryItemSelected,
        { borderBottomColor: colors.border }
      ]}
      onPress={() => setSelectedCategory(item)}
    >
      <View style={styles.categoryContent}>
        <Image 
          source={{ uri: item.id === 0 ? item.image : (item.image || item.imageUrl || '') }}
          style={[
            styles.categoryIcon,
            { opacity: selectedCategory?.id === item.id ? 1 : 0.6 }
          ]}
        />
        <ThemedText 
          numberOfLines={1} 
          style={[
            styles.categoryText,
            selectedCategory?.id === item.id ? styles.categoryTextSelected : { color: colors.text }
          ]}
        >
          {item.name}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      {isLoadingCategories ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.contentContainer}>
          {/* Left Panel: Categories List */}
          <View style={[styles.categoriesPanel, { borderRightColor: colors.border }]}>
            <FlatList
              data={categories}
              renderItem={renderCategoryItem}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
            />
          </View>

          {/* Right Panel: Products Grid */}
          <View style={styles.productsPanel}>
            {isLoadingProducts ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <CategoryProductGrid 
                data={products} 
                containerWidth={WINDOW_WIDTH - (isTabletOrLarger ? 200 : 120)}
              />
            )}
          </View>
        </View>
      )}
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
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  categoriesPanel: {
    width: isTabletOrLarger ? 200 : 120,
    borderRightWidth: 1,
    backgroundColor: colors.card,
  },
  categoryItem: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  categoryContent: {
    alignItems: 'center',
    gap: 8,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  categoryItemSelected: {
    backgroundColor: colors.background,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  categoryTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  productsPanel: {
    flex: 1,
    backgroundColor: colors.background,
  },
  productsPanelContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  productGridContainer: {
    flex: 1,
  },
});
