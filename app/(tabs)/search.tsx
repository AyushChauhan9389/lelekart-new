import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { Input } from '@/components/ui/Input';
import { IconSymbol } from '@/components/ui/IconSymbol';
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
          leftIcon={<IconSymbol name="magnifyingglass" size={20} color={colors.textSecondary} />}
          rightIcon={
            query ? (
              <Pressable onPress={() => setQuery('')}>
                <IconSymbol
                  name="xmark.circle.fill"
                  size={20}
                  color={colors.textSecondary}
                />
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
