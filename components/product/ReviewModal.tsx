import React, { useState } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, TextInput, Platform } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { LoadingButton } from '@/components/ui/LoadingButton';
import { Star, X } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface ReviewModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (data: { rating: number; title: string; review: string }) => Promise<void>;
}

export function ReviewModal({ isVisible, onClose, onSubmit }: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ rating, title, review });
      // Reset form after successful submission
      setRating(5);
      setTitle('');
      setReview('');
      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const styles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    contentContainer: {
      margin: 20,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
      maxHeight: '80%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
    },
    closeButton: {
      padding: 4,
    },
    ratingContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
      gap: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      color: colors.text,
      backgroundColor: colors.background,
    },
    reviewInput: {
      height: 100,
      textAlignVertical: 'top',
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
    },
  });

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <ThemedText style={styles.title}>Write a Review</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Rating Selection */}
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
              >
                <Star
                  size={32}
                  color={colors.warning}
                  fill={star <= rating ? colors.warning : 'none'}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Title Input */}
          <TextInput
            style={styles.input}
            placeholder="Review Title"
            placeholderTextColor={colors.textSecondary}
            value={title}
            onChangeText={setTitle}
          />

          {/* Review Input */}
          <TextInput
            style={[styles.input, styles.reviewInput]}
            placeholder="Write your review here..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            value={review}
            onChangeText={setReview}
          />

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <LoadingButton
              variant="outline"
              onPress={onClose}
              style={{ minWidth: 100 }}
            >
              Cancel
            </LoadingButton>
            <LoadingButton
              onPress={handleSubmit}
              disabled={!title || !review}
              loading={isSubmitting}
              style={{ minWidth: 100 }}
            >
              Submit
            </LoadingButton>
          </View>
        </View>
      </View>
    </Modal>
  );
}
