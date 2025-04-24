import React, { useState, useCallback, useRef } from 'react';
import { Dimensions, FlatList, Image, Pressable, StyleSheet, View, ViewToken } from 'react-native';

interface ImageCarouselProps {
  images: string[];
}

const { width: WINDOW_WIDTH } = Dimensions.get('window');
const PLACEHOLDER_IMAGE = 'https://lelekart.in/images/placeholder.png';

export function ImageCarousel({ images: rawImages }: ImageCarouselProps) {
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [validImages, setValidImages] = useState<string[]>([]);
  const [failedImages, setFailedImages] = useState(new Set<string>());

  // Filter and validate images on mount
  React.useEffect(() => {
    const filtered = rawImages.filter(url => 
      url && 
      typeof url === 'string' && 
      (url.startsWith('http://') || url.startsWith('https://'))
    );
    setValidImages(filtered.length > 0 ? filtered : [PLACEHOLDER_IMAGE]);
  }, [rawImages]);

  const handleImageError = useCallback((failedUrl: string) => {
    setFailedImages(prev => {
      const newSet = new Set(prev);
      newSet.add(failedUrl);
      return newSet;
    });
    
    // If all images have failed, use placeholder
    if (failedImages.size === validImages.length - 1) {
      setValidImages([PLACEHOLDER_IMAGE]);
    }
  }, [validImages.length, failedImages]);

  const renderImage = ({ item }: { item: string }) => (
    <Image 
      source={{ uri: failedImages.has(item) ? PLACEHOLDER_IMAGE : item }} 
      style={styles.image}
      onError={() => handleImageError(item)}
    />
  );

  // Thumbnail rendering removed

  const onViewableItemsChanged = useCallback(({ viewableItems }: { 
    viewableItems: Array<ViewToken>
  }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setActiveIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={validImages}
        renderItem={renderImage}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
      {/* Thumbnail container removed */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: WINDOW_WIDTH,
  },
  image: {
    width: WINDOW_WIDTH,
    height: WINDOW_WIDTH,
    resizeMode: 'contain',
  },
  // Thumbnail styles removed
});
