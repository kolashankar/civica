import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RatingInputProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  required?: boolean;
}

export default function RatingInput({ value, onChange, label, required }: RatingInputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onChange(star)}
            style={styles.starButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name={star <= value ? 'star' : 'star-outline'}
              size={36}
              color={star <= value ? '#FF9500' : '#8E8E93'}
            />
          </TouchableOpacity>
        ))}
      </View>
      {value > 0 && (
        <Text style={styles.ratingText}>
          {value} {value === 1 ? 'star' : 'stars'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  required: {
    color: '#FF3B30',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
});
