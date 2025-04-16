import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Search, XCircle } from 'lucide-react-native'; // Import Lucide icons
import { ThemedView } from '@/components/ThemedView';
import { Input } from '@/components/ui/Input';
// Removed IconSymbol import
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { api } from '@/utils/api';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <ThemedView style={styles.container}>
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search products..."
          value={query}
          onChangeText={setQuery}
          autoFocus
          leftIcon={<Search size={20} color={colors.textSecondary} />} // Use Lucide Search
          rightIcon={
            query ? (
              <Pressable onPress={() => setQuery('')}>
                <XCircle size={20} color={colors.textSecondary} /> {/* Use Lucide XCircle */}
              </Pressable>
            ) : undefined
          }
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
  },
});
