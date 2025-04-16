import React, { useState } from 'react';
import { Dimensions, FlatList, Image, Pressable, StyleSheet, View } from 'react-native';

interface ImageCarouselProps {
  images: string[];
}

const { width: WINDOW_WIDTH } = Dimensions.get('window');

export function ImageCarousel({ images }: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const renderImage = ({ item }: { item: string }) => (
    <Image source={{ uri: item }} style={styles.image} />
  );

  const renderThumbnail = (image: string, index: number) => (
    <Pressable
      key={index}
      onPress={() => {
        flatListRef.current?.scrollToIndex({ index, animated: true });
        setActiveIndex(index);
      }}>
      <Image
        source={{ uri: image }}
        style={[
          styles.thumbnail,
          { opacity: activeIndex === index ? 1 : 0.6 },
        ]}
      />
    </Pressable>
  );

  const flatListRef = React.useRef<FlatList>(null);

  const onViewableItemsChanged = React.useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
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
        data={images}
        renderItem={renderImage}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
      <View style={styles.thumbnailContainer}>
        {images.map((image, index) => renderThumbnail(image, index))}
      </View>
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
  thumbnailContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 4,
    resizeMode: 'cover',
  },
});
