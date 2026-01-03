import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { inspectionsApi } from '../../../services/api';

interface FormData {
  cleanliness_rating: number;
  staff_behavior_rating: number;
  service_quality_rating: number;
  issues: string;
  complaints: string;
  suggestions: string;
  photos: string[];
}

export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [inspection, setInspection] = useState<any | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      // Load inspection details
      const inspectionData = await inspectionsApi.getInspectionDetail(id);
      setInspection(inspectionData);

      // Load draft
      const draftKey = `inspection_draft_${id}`;
      const draft = await AsyncStorage.getItem(draftKey);
      if (draft) {
        setFormData(JSON.parse(draft));
      } else {
        Alert.alert('Error', 'No draft found. Please fill the form first.');
        router.back();
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load data');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const clearDraft = async () => {
    if (!id) return;

    try {
      const draftKey = `inspection_draft_${id}`;
      await AsyncStorage.removeItem(draftKey);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  };

  const handleEdit = () => {
    router.back();
  };

  const handleSubmit = async () => {
    Alert.alert(
      'Submit Inspection',
      'Are you sure you want to submit this inspection? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Submit',
          style: 'default',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              await inspectionsApi.submitInspection(id!, formData!);
              await clearDraft();
              // Navigate to success screen
              router.replace('/inspection/success');
            } catch (error: any) {
              Alert.alert(
                'Submission Failed',
                error.response?.data?.detail || 'Failed to submit inspection. Please try again.'
              );
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!formData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No data to review</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Inspection</Text>
        <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Inspection Info */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>{inspection?.task_name}</Text>
          <Text style={styles.officeName}>{inspection?.office?.name}</Text>
        </View>

        {/* Ratings Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Ratings</Text>

          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Cleanliness</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name="star"
                  size={20}
                  color={star <= formData.cleanliness_rating ? '#FF9500' : '#E5E5EA'}
                />
              ))}
            </View>
          </View>

          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Staff Behavior</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name="star"
                  size={20}
                  color={star <= formData.staff_behavior_rating ? '#FF9500' : '#E5E5EA'}
                />
              ))}
            </View>
          </View>

          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Service Quality</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name="star"
                  size={20}
                  color={star <= formData.service_quality_rating ? '#FF9500' : '#E5E5EA'}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Observations Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Observations</Text>

          <View style={styles.textReviewItem}>
            <Text style={styles.textReviewLabel}>Issues Identified</Text>
            <Text style={styles.textReviewValue}>{formData.issues}</Text>
          </View>

          <View style={styles.textReviewItem}>
            <Text style={styles.textReviewLabel}>Complaints</Text>
            <Text style={styles.textReviewValue}>{formData.complaints}</Text>
          </View>

          <View style={styles.textReviewItem}>
            <Text style={styles.textReviewLabel}>Suggestions</Text>
            <Text style={styles.textReviewValue}>{formData.suggestions}</Text>
          </View>
        </View>

        {/* Photos Section */}
        {formData.photos.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Photos ({formData.photos.length})</Text>
            <View style={styles.photosGrid}>
              {formData.photos.map((photo, index) => (
                <Image key={index} source={{ uri: photo }} style={styles.photo} />
              ))}
            </View>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.7}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text style={styles.submitButtonText}>Submit Inspection</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  editButton: {
    padding: 4,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  officeName: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  reviewLabel: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  textReviewItem: {
    marginBottom: 16,
  },
  textReviewLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    fontWeight: '600',
  },
  textReviewValue: {
    fontSize: 16,
    color: '#1a1a1a',
    lineHeight: 24,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photo: {
    width: '48%',
    height: 120,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    marginBottom: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#999',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});
