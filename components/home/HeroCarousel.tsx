import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  View,
  ViewabilityConfig,
  ViewToken,
} from 'react-native';
import { router } from 'expo-router';
import { FlatList } from 'react-native-gesture-handler';
import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ThemedText';
import type { FeaturedHeroProduct } from '@/types/api';
import { useColorScheme } from '@/hooks/useColorScheme'; // Import useColorScheme
import Colors from '@/constants/Colors'; // Import Colors

interface HeroCarouselProps {
  data: FeaturedHeroProduct[];
}

const { width: WINDOW_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = WINDOW_WIDTH;

export function HeroCarousel({ data }: HeroCarouselProps) {
  const colorScheme = useColorScheme(); // Get current color scheme
  const colors = Colors[colorScheme ?? 'light']; // Get theme colors
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  const viewabilityConfig: ViewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setActiveIndex(viewableItems[0].index ?? 0);
      }
    }
  ).current;

  const renderItem = ({ item }: { item: FeaturedHeroProduct }) => (
    <Pressable
      style={[styles.slide, { width: ITEM_WIDTH }]}
      onPress={() => {
        if (item.productId) {
          router.push(`/product/${item.productId}`);
        }
        // Optionally handle category navigation if needed:
        // else if (item.category) { router.push(`/category/${item.category}`); }
      }}>
      {/* Use ImageBackground for simpler layout */}
      <Image source={{ uri: item.url }} style={StyleSheet.absoluteFill} />
      <View style={styles.overlay}>
        <ThemedText type="title" style={styles.title}>
          {item.title}
        </ThemedText>
        <ThemedText style={styles.subtitle}>{item.subtitle}</ThemedText>
        {/* Display badge if available */}
        {item.badgeText && (
          <View style={styles.badge}>
            <ThemedText style={styles.badgeText}>{item.badgeText}</ThemedText>
          </View>
        )}
        <Button
          onPress={() => {
            if (item.productId) {
              router.push(`/product/${item.productId}`);
            }
            // Optionally handle category navigation if needed
          }}
          // Apply specific styles for this context, merging them into one object
          style={{ ...styles.button, backgroundColor: 'white' }}
          textStyle={{ color: colors.text }}>
          {item.buttonText}
        </Button>
      </View>
    </Pressable>
  );

  const renderDotIndicator = () => {
    return (
      <View style={styles.pagination}>
        {data.map((_, index) => {
          const inputRange = [
            (index - 1) * ITEM_WIDTH,
            index * ITEM_WIDTH,
            (index + 1) * ITEM_WIDTH,
          ];

          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.8, 1.2, 0.8],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.4, 1, 0.4],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  transform: [{ scale }],
                  opacity,
                  backgroundColor: 'white',
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
      {renderDotIndicator()}
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    height: 250, // Adjust height as needed
    justifyContent: 'flex-end', // Align content to the bottom
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Dark overlay for text visibility
    padding: 20,
  },
  title: {
    fontSize: 28, // Adjust size
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    marginBottom: 16,
    opacity: 0.9,
  },
  badge: {
    backgroundColor: 'red', // Example badge style
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    position: 'absolute',
    top: 10,
    right: 10,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  button: {
    alignSelf: 'flex-start',
    // Remove hardcoded background color, rely on Button component's default or theme
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 5,
  },
  // Keep pagination styles
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});
