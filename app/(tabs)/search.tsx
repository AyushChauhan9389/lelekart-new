import React, { useCallback, useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Dimensions, 
  Pressable, 
  ActivityIndicator, 
  TextInput,
  Keyboard
} from 'react-native';
import { Search as SearchIcon, ArrowLeft, X } from 'lucide-react-native';
import { router } from 'expo-router';
import Animated, { 
  withSpring, 
  withTiming, 
  useAnimatedStyle, 
  useSharedValue,
  FadeIn,
  FadeOut,
  Layout
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchProductGrid } from '@/components/search/SearchProductGrid'; // Import the new component
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { Product } from '@/types/api';
import { api } from '@/utils/api';

const RECENT_SEARCHES_KEY = '@recent_searches';
const MAX_RECENT_SEARCHES = 10;

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const searchBarScale = useSharedValue(0.95);

  // Handle keyboard events
  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Animate search bar on mount
  useEffect(() => {
    searchBarScale.value = withSpring(1, {
      mass: 0.5,
      damping: 12,
    });
  }, []);

  const searchBarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: searchBarScale.value }],
  }));

  // Load recent searches on mount
  useEffect(() => {
    const loadRecentSearches = async () => {
      try {
        const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
        if (stored) {
          setRecentSearches(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    };
    loadRecentSearches();
  }, []);

  // Save recent searches
  const saveRecentSearch = async (query: string) => {
    try {
      const newSearches = [
        query,
        ...recentSearches.filter(s => s !== query),
      ].slice(0, MAX_RECENT_SEARCHES);
      
      setRecentSearches(newSearches);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newSearches));
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  };

  // Debounce search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    try {
      // Temporary direct API call until we update the API utility
      const response = await fetch(`https://lelekart.in/api/lelekart-search?q=${encodeURIComponent(query)}&limit=50`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setSearchResults(data);
        await saveRecentSearch(query.trim());
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching products:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInput = (query: string) => {
    setSearchQuery(query);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeRecentSearch = async (searchTerm: string) => {
    const newSearches = recentSearches.filter(s => s !== searchTerm);
    setRecentSearches(newSearches);
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newSearches));
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <Animated.View 
            style={[
              styles.searchBar, 
              { backgroundColor: colors.surface },
              searchBarAnimatedStyle
            ]}
          >
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={24} color={colors.text} />
            </Pressable>
            
            <View style={styles.searchInputContainer}>
              <SearchIcon size={20} color={colors.textSecondary} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search products..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={handleSearchInput}
                onFocus={() => setIsFocused(true)}
                autoFocus
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={clearSearch} style={styles.clearButton}>
                  <X size={20} color={colors.textSecondary} />
                </Pressable>
              )}
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {isSearching ? (
          <Animated.View 
            entering={FadeIn.duration(200)} 
            exiting={FadeOut.duration(200)} 
            style={styles.loadingContainer}
          >
            <ActivityIndicator size="large" color={colors.primary} />
          </Animated.View>
        ) : searchResults.length > 0 ? (
          <Animated.View 
            entering={FadeIn.duration(300)} 
            layout={Layout.springify()}
          >
            {/* Use SearchProductGrid and pass the calculated content width */}
            <SearchProductGrid data={searchResults} containerWidth={CONTENT_WIDTH} />
          </Animated.View>
        ) : searchQuery ? (
          <Animated.View 
            entering={FadeIn.duration(200)} 
            style={styles.noResults}
          >
            <ThemedText style={styles.noResultsText}>No results found for "{searchQuery}"</ThemedText>
          </Animated.View>
        ) : (
          <Animated.View 
            entering={FadeIn.duration(300)}
            style={styles.recentSearches}
          >
            <ThemedText style={styles.recentTitle}>Recent Searches</ThemedText>
            {recentSearches.map((term, index) => (
              <Animated.View
                key={index}
                entering={FadeIn.delay(index * 100)}
                exiting={FadeOut}
                layout={Layout.springify()}
              >
                <Pressable
                  style={[styles.recentItem, { borderBottomColor: colors.border }]}
                  onPress={() => handleSearchInput(term)}
                >
                  <View style={styles.recentItemContent}>
                    <SearchIcon size={16} color={colors.textSecondary} style={styles.recentIcon} />
                    <ThemedText style={styles.recentText}>{term}</ThemedText>
                  </View>
                  <Pressable
                    onPress={() => removeRecentSearch(term)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <X size={16} color={colors.textSecondary} />
                  </Pressable>
                </Pressable>
              </Animated.View>
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const { width: WINDOW_WIDTH } = Dimensions.get('window');
const SPACING = WINDOW_WIDTH < 380 ? 12 : 16;
const CONTENT_WIDTH = WINDOW_WIDTH - SPACING * 2; // Define CONTENT_WIDTH

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING,
    paddingVertical: SPACING / 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
  },
  backButton: {
    padding: SPACING,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: SPACING,
  },
  searchIcon: {
    marginLeft: SPACING,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: SPACING,
    paddingHorizontal: SPACING / 2,
  },
  clearButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: SPACING,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING * 2,
  },
  noResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING * 2,
  },
  noResultsText: {
    fontSize: 16,
    textAlign: 'center',
  },
  recentSearches: {
    paddingTop: SPACING,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  recentItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentIcon: {
    marginRight: SPACING,
  },
  recentText: {
    fontSize: 14,
  },
});
