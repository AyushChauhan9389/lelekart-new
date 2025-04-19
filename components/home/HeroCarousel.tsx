import React, { useRef, useState } from 'react';
import {
  // Animated, // Removed duplicate import from react-native
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  View,
  ViewabilityConfig,
  ViewToken,
  FlatList, // Import standard FlatList
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated'; // Import Reanimated hooks
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ThemedText';
import type { FeaturedHeroProduct } from '@/types/api';
import { useColorScheme } from '@/hooks/useColorScheme'; // Import useColorScheme
import Colors from '@/constants/Colors'; // Import Colors

interface HeroCarouselProps {
  data: FeaturedHeroProduct[];
}

const { width: WINDOW_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = Math.min(WINDOW_WIDTH, 1200); // Cap maximum width
const ITEM_HEIGHT = WINDOW_WIDTH >= 768 ? 400 : WINDOW_WIDTH >= 480 ? 300 : 250; // Responsive height

// Create Animated FlatList component
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<FeaturedHeroProduct>);

export function HeroCarousel({ data }: HeroCarouselProps) {
  const colorScheme = useColorScheme(); // Get current color scheme
  const colors = Colors[colorScheme ?? 'light']; // Get theme colors
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useSharedValue(0); // Use useSharedValue
  const flatListRef = useRef<FlatList<FeaturedHeroProduct>>(null); // Add type to ref

  // Define the scroll handler using useAnimatedScrollHandler
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

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
        {/* Add checks for text content before rendering */}
        {item.title && (
          <ThemedText type="title" style={styles.title}>
            {item.title}
          </ThemedText>
        )}
        {item.subtitle && (
          <ThemedText style={styles.subtitle}>{item.subtitle}</ThemedText>
        )}
        {/* Display badge if available */}
        {item.badgeText && (
          <View style={[styles.badge, { backgroundColor: colors.error }]}> {/* Use theme color */}
            <ThemedText style={styles.badgeText}>{item.badgeText}</ThemedText>
          </View>
        )}
        {/* Add check for button text */}
        {item.buttonText && (
          <Button
              variant="secondary"
              onPress={() => {
                if (item.productId) {
                  router.push(`/product/${item.productId}`);
                }
              }}
              style={styles.button}
            >
              <ThemedText style={{ color: 'white' }}>{item.buttonText}</ThemedText>
            </Button>
        )}
      </View>
    </Pressable>
  );

  const renderDotIndicator = () => {
    return (
      <View style={styles.pagination}>
        {data.map((_, index) => {
          // Use useAnimatedStyle for each dot
          const animatedDotStyle = useAnimatedStyle(() => {
            const inputRange = [
              (index - 1) * ITEM_WIDTH,
              index * ITEM_WIDTH,
              (index + 1) * ITEM_WIDTH,
            ];

            const scale = interpolate(
              scrollX.value, // Use shared value
              inputRange,
              [0.8, 1.2, 0.8],
              Extrapolation.CLAMP // Use Extrapolation enum
            );

            const opacity = interpolate(
              scrollX.value, // Use shared value
              inputRange,
              [0.4, 1, 0.4],
              Extrapolation.CLAMP // Use Extrapolation enum
            );

            return {
              transform: [{ scale }],
              opacity,
            };
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                { backgroundColor: colors.primary }, // Static background color
                animatedDotStyle, // Apply animated styles
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View>
      <AnimatedFlatList // Use AnimatedFlatList
        ref={flatListRef}
        data={data}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={scrollHandler} // Use the animated scroll handler
        scrollEventThrottle={16} // Recommended for useAnimatedScrollHandler
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        contentContainerStyle={{ alignItems: 'center' }}
      />
      {renderDotIndicator()}
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    height: ITEM_HEIGHT,
    justifyContent: 'flex-end',
    width: ITEM_WIDTH,
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: WINDOW_WIDTH >= 768 ? 20 : 0,
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: WINDOW_WIDTH >= 768 ? 32 : 20,
  },
  title: {
    fontSize: WINDOW_WIDTH >= 768 ? 36 : WINDOW_WIDTH >= 480 ? 32 : 28,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: WINDOW_WIDTH >= 768 ? 12 : 8,
    // Add shadow effect using native shadow properties
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
  },
  subtitle: {
    fontSize: WINDOW_WIDTH >= 768 ? 18 : 16,
    color: 'white',
    marginBottom: WINDOW_WIDTH >= 768 ? 24 : 16,
    opacity: 0.9,
    maxWidth: WINDOW_WIDTH >= 768 ? 600 : undefined,
    // Add shadow effect using native shadow properties
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
     shadowRadius: 1,
   },
   badge: {
     // backgroundColor set inline using theme color
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
    paddingHorizontal: WINDOW_WIDTH >= 768 ? 24 : 16,
    paddingVertical: WINDOW_WIDTH >= 768 ? 12 : 8,
    borderRadius: 8,
    minWidth: WINDOW_WIDTH >= 768 ? 160 : undefined,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  dot: {
    width: WINDOW_WIDTH >= 768 ? 10 : 8,
    height: WINDOW_WIDTH >= 768 ? 10 : 8,
    borderRadius: WINDOW_WIDTH >= 768 ? 5 : 4,
    marginHorizontal: WINDOW_WIDTH >= 768 ? 6 : 4,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
});
