import React, { useCallback, useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, Dimensions, Platform, TouchableOpacity } from 'react-native';
import { Search as SearchIcon, ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { Input } from '@/components/ui/Input';
import { ProductGrid } from '@/components/home/ProductGrid';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { Product } from '@/types/api';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setIsSearching(true);
      try {
        const response = await fetch(`https://lelekart.in/api/lelekart-search?q=${encodeURIComponent(query)}&limit=50`);
        const data = await response.json();
        setSearchResults(data);
      } catch (error) {
        console.error('Error searching products:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, handleSearch]);

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <SafeAreaView>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Search</ThemedText>
        </View>
        </SafeAreaView>
        <Input
          placeholder="Search products..."
          containerStyle={styles.searchContainer}
          style={styles.searchInput}
          leftIcon={<SearchIcon size={20} color={colors.textSecondary} />}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus
        />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {isSearching && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
        {searchResults.length > 0 ? (
          <View style={styles.section}>
            <ProductGrid data={searchResults} />
          </View>
        ) : searchQuery ? (
          <View style={[styles.section, styles.noResults]}>
            <ThemedText>No results found</ThemedText>
          </View>
        ) : (
          <View style={[styles.section, styles.noResults]}>
            <ThemedText>Search for products</ThemedText>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const WINDOW_WIDTH = Dimensions.get('window').width;
const SPACING = WINDOW_WIDTH < 380 ? 12 : 16;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING,
    paddingBottom: SPACING,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING,
  },
  backButton: {
    marginRight: SPACING,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  searchContainer: {
    marginBottom: 0,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  searchInput: {
    backgroundColor: Colors.light.background,
    borderRadius: 20,
    paddingVertical: WINDOW_WIDTH < 380 ? 8 : 10,
    fontSize: WINDOW_WIDTH < 380 ? 14 : 16,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: SPACING * 2,
  },
  section: {
    marginTop: SPACING,
    marginBottom: SPACING,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING,
  },
  noResults: {
    alignItems: 'center',
    padding: SPACING * 2,
  },
});
