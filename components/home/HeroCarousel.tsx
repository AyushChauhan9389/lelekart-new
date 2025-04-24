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
const SPACING = 12; // Define SPACING at the top level

// Create Animated FlatList component
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<FeaturedHeroProduct>);

export function HeroCarousel({ data }: HeroCarouselProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  // Pass SPACING to createStyles
  const styles = React.useMemo(() => createStyles(colors, colorScheme, SPACING), [colors, colorScheme]);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useSharedValue(0);
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
    // Apply onPress directly to the main slide View
    <Pressable
      style={[styles.slide, { width: ITEM_WIDTH }]}
      onPress={() => {
        if (item.productId) router.push(`/product/${item.productId}`);
      }}
    >
      {/* Image Container */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.url }} style={styles.image} />
      </View>

      {/* Footer Container for Text and Button */}
      <View style={[styles.footerContainer, { backgroundColor: colors.card }]}>
           {item.badgeText && (
             <View style={[styles.badge, { backgroundColor: colors.error }]}>
               <ThemedText style={styles.badgeText}>{item.badgeText}</ThemedText>
             </View>
           )}
          {item.title && (
            <ThemedText type="title" style={styles.title}>
              {item.title}
            </ThemedText>
          )}
          {item.subtitle && (
            <ThemedText style={styles.subtitle}>{item.subtitle}</ThemedText>
          )}
          {item.buttonText && (
            <Button
              variant="secondary"
              onPress={() => {
                if (item.productId) router.push(`/product/${item.productId}`);
              }}
              style={styles.button}
            >
              {item.buttonText}
            </Button>
          )}
        </View>
      {/* </Pressable> Removed inner Pressable */}
    </Pressable> // Close the main Pressable/View
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
    <View style={styles.carouselContainer}>
      <AnimatedFlatList
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
        contentContainerStyle={{ alignItems: 'center' }} // Keep this for centering slides if ITEM_WIDTH < WINDOW_WIDTH
      />
      {renderDotIndicator()}
    </View>
  );
}

// Update createStyles signature to accept spacing
const createStyles = (colors: typeof Colors.light, colorScheme: 'light' | 'dark' | null, spacing: number) => StyleSheet.create({
  carouselContainer: {
    marginBottom: spacing * 1.5,
  },
  slide: {
    width: ITEM_WIDTH,
    alignSelf: 'center',
    overflow: 'hidden', // Keep hidden overflow for border radius
    borderRadius: 4, // Boxy corners
    borderWidth: 1,
    borderColor: colors.border,
  },
  // Removed pressableContent style as it's no longer used
  imageContainer: {
    width: '100%',
    height: ITEM_HEIGHT, // Restore fixed height
    backgroundColor: '#f8f8f8',
  },
  image: {
    width: '100%',
    height: '100%', // Restore height
    resizeMode: 'cover', // Change back to cover
  },
  footerContainer: {
    // padding: SPACING * 1.25, // Removed duplicate
    padding: spacing * 1.25, // Keep the one using the spacing variable
    position: 'relative',
    backgroundColor: colors.card, // Use card background for footer
  },
  title: {
    fontSize: WINDOW_WIDTH >= 768 ? 24 : 20,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing * 0.5,
  },
  subtitle: {
    fontSize: WINDOW_WIDTH >= 768 ? 16 : 14,
    color: colors.textSecondary,
    marginBottom: spacing,
    opacity: 0.9,
    maxWidth: '100%',
   },
   badge: {
     paddingHorizontal: 8,
     paddingVertical: 4,
     borderRadius: 4,
     position: 'absolute',
     top: spacing * 0.75, // Use spacing variable
     right: spacing * 0.75,
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
    marginTop: spacing, // Use spacing variable
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
