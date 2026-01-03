import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { inspectionsApi } from '../../../services/api';
import { Inspection } from '../../../types';
import RatingInput from '../../../components/ui/RatingInput';
import PhotoPicker from '../../../components/ui/PhotoPicker';

interface FormData {
  cleanliness_rating: number;
  staff_behavior_rating: number;
  service_quality_rating: number;
  issues: string;
  complaints: string;
  suggestions: string;
  photos: string[];
}

export default function InspectionFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [inspection, setInspection] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    cleanliness_rating: 0,
    staff_behavior_rating: 0,
    service_quality_rating: 0,
    issues: '',
    complaints: '',
    suggestions: '',
    photos: [],
  });

  useEffect(() => {
    loadInspection();
    loadDraft();
  }, [id]);

  // Auto-save draft when form data changes
  useEffect(() => {
    if (!isLoading && inspection) {
      saveDraft();
    }
  }, [formData]);

  const loadInspection = async () => {
    if (!id) return;

    try {
      const data = await inspectionsApi.getInspectionDetail(id);
      setInspection(data);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load inspection details');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const loadDraft = async () => {
    if (!id) return;

    try {
      const draftKey = `inspection_draft_${id}`;
      const draft = await AsyncStorage.getItem(draftKey);
      if (draft) {
        const parsedDraft = JSON.parse(draft);
        setFormData(parsedDraft);
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
  };

  const saveDraft = async () => {
    if (!id) return;

    try {
      const draftKey = `inspection_draft_${id}`;
      await AsyncStorage.setItem(draftKey, JSON.stringify(formData));
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  };

  const calculateProgress = (): number => {
    let completed = 0;
    const total = 6; // 3 ratings + 3 text fields

    if (formData.cleanliness_rating > 0) completed++;
    if (formData.staff_behavior_rating > 0) completed++;
    if (formData.service_quality_rating > 0) completed++;
    if (formData.issues.trim()) completed++;
    if (formData.complaints.trim()) completed++;
    if (formData.suggestions.trim()) completed++;

    return Math.round((completed / total) * 100);
  };

  const validateForm = (): boolean => {
    if (formData.cleanliness_rating === 0) {
      Alert.alert('Validation Error', 'Please provide a cleanliness rating');
      return false;
    }
    if (formData.staff_behavior_rating === 0) {
      Alert.alert('Validation Error', 'Please provide a staff behavior rating');
      return false;
    }
    if (formData.service_quality_rating === 0) {
      Alert.alert('Validation Error', 'Please provide a service quality rating');
      return false;
    }
    if (!formData.issues.trim()) {
      Alert.alert('Validation Error', 'Please describe any issues identified');
      return false;
    }
    if (!formData.complaints.trim()) {
      Alert.alert('Validation Error', 'Please describe any complaints');
      return false;
    }
    if (!formData.suggestions.trim()) {
      Alert.alert('Validation Error', 'Please provide suggestions');
      return false;
    }
    return true;
  };

  const handleReview = () => {
    if (!validateForm()) return;
    // Navigate to review screen
    router.push(`/inspection/review/${id}`);
  };

  const handleBack = () => {
    Alert.alert(
      'Leave Form',
      'Your progress has been saved. Do you want to leave?',
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', style: 'default', onPress: () => router.back() },
      ]
    );
  };

  const updateFormField = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const progress = calculateProgress();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Inspection Form</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{progress}% Complete</Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Task Info */}
          <View style={styles.taskInfo}>
            <Text style={styles.taskName}>{inspection?.task_name}</Text>
            <Text style={styles.officeName}>{inspection?.office?.name}</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Ratings</Text>
            <Text style={styles.sectionSubtitle}>Rate the following aspects (1-5 stars)</Text>

            {/* Rating Fields */}
            <RatingInput
              label="Cleanliness Rating"
              value={formData.cleanliness_rating}
              onChange={(value) => updateFormField('cleanliness_rating', value)}
              required
            />

            <RatingInput
              label="Staff Behavior Rating"
              value={formData.staff_behavior_rating}
              onChange={(value) => updateFormField('staff_behavior_rating', value)}
              required
            />

            <RatingInput
              label="Service Quality Rating"
              value={formData.service_quality_rating}
              onChange={(value) => updateFormField('service_quality_rating', value)}
              required
            />
          </View>

          {/* Text Fields */}
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Observations</Text>
            <Text style={styles.sectionSubtitle}>Provide detailed information</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Issues Identified <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe any issues you identified during the inspection..."
                placeholderTextColor="#999"
                value={formData.issues}
                onChangeText={(text) => updateFormField('issues', text)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Complaints <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="List any complaints or concerns..."
                placeholderTextColor="#999"
                value={formData.complaints}
                onChangeText={(text) => updateFormField('complaints', text)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Suggestions <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Provide suggestions for improvement..."
                placeholderTextColor="#999"
                value={formData.suggestions}
                onChangeText={(text) => updateFormField('suggestions', text)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Photos Section */}
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Photo Documentation</Text>
            <Text style={styles.sectionSubtitle}>Add photos to support your inspection</Text>

            <PhotoPicker
              photos={formData.photos}
              onChange={(photos) => updateFormField('photos', photos)}
            />
          </View>

          {/* Review Button */}
          <TouchableOpacity
            style={styles.reviewButton}
            onPress={handleReview}
            activeOpacity={0.7}
          >
            <Text style={styles.reviewButtonText}>Review & Submit</Text>
            <Ionicons name="arrow-forward" size={24} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.draftNote}>💾 Draft is automatically saved as you type</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
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
  placeholder: {
    width: 32,
  },
  progressContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  taskInfo: {
    backgroundColor: '#007AFF15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  taskName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  officeName: {
    fontSize: 14,
    color: '#007AFF',
  },
  formCard: {
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  required: {
    color: '#FF3B30',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1a1a1a',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  reviewButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  draftNote: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
});
