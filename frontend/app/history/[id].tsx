import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { inspectionsApi } from '../../services/api';
import { Inspection } from '../../types';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - 48) / 3;

export default function HistoryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInspectionDetail();
  }, [id]);

  const loadInspectionDetail = async () => {
    try {
      const data = await inspectionsApi.getInspectionDetail(id as string);
      setInspection(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load inspection details');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return '#34C759';
      case 'responded':
        return '#FF9500';
      case 'closed':
        return '#8E8E93';
      case 'escalated':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={20}
            color={star <= rating ? '#FFD700' : '#D1D1D6'}
          />
        ))}
      </View>
    );
  };

  const renderTimeline = () => {
    const timeline = [
      {
        status: 'assigned',
        label: 'Assigned',
        date: inspection?.assigned_date,
        completed: true,
      },
      {
        status: 'submitted',
        label: 'Submitted',
        date: inspection?.report?.submitted_at,
        completed: inspection?.status !== 'assigned',
      },
      {
        status: 'responded',
        label: 'Office Responded',
        date: inspection?.office_response?.responded_at,
        completed: ['responded', 'closed'].includes(inspection?.status || ''),
      },
      {
        status: 'closed',
        label: 'Closed',
        date: inspection?.govt_review?.reviewed_at,
        completed: inspection?.status === 'closed',
      },
    ];

    return (
      <View style={styles.timelineContainer}>
        {timeline.map((item, index) => (
          <View key={item.status} style={styles.timelineItem}>
            <View style={styles.timelineIconContainer}>
              <View
                style={[
                  styles.timelineIcon,
                  {
                    backgroundColor: item.completed ? '#007AFF' : '#E5E5EA',
                  },
                ]}
              >
                {item.completed && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
              {index < timeline.length - 1 && (
                <View
                  style={[
                    styles.timelineLine,
                    {
                      backgroundColor: item.completed ? '#007AFF' : '#E5E5EA',
                    },
                  ]}
                />
              )}
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>{item.label}</Text>
              {item.date && (
                <Text style={styles.timelineDate}>
                  {new Date(item.date).toLocaleString()}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!inspection) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Inspection Details</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Status Badge */}
        <View style={styles.statusSection}>
          <View
            style={[
              styles.statusBadgeLarge,
              { backgroundColor: `${getStatusColor(inspection.status)}15` },
            ]}
          >
            <Text
              style={[
                styles.statusTextLarge,
                { color: getStatusColor(inspection.status) },
              ]}
            >
              {inspection.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Office Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Office Information</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{inspection.office?.name}</Text>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={16} color="#8E8E93" />
              <Text style={styles.infoText}>{inspection.office?.address}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="call" size={16} color="#8E8E93" />
              <Text style={styles.infoText}>{inspection.office?.contact_phone}</Text>
            </View>
          </View>
        </View>

        {/* Submitted Report */}
        {inspection.report && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Report</Text>
            <View style={styles.card}>
              {/* Ratings */}
              <View style={styles.ratingItem}>
                <Text style={styles.ratingLabel}>Cleanliness</Text>
                {renderStars(inspection.report.cleanliness_rating)}
              </View>
              <View style={styles.ratingItem}>
                <Text style={styles.ratingLabel}>Staff Behavior</Text>
                {renderStars(inspection.report.staff_behavior_rating)}
              </View>
              <View style={styles.ratingItem}>
                <Text style={styles.ratingLabel}>Service Quality</Text>
                {renderStars(inspection.report.service_quality_rating)}
              </View>

              {/* Text Fields */}
              <View style={styles.textFieldContainer}>
                <Text style={styles.fieldLabel}>Issues Identified</Text>
                <Text style={styles.fieldValue}>{inspection.report.issues}</Text>
              </View>

              <View style={styles.textFieldContainer}>
                <Text style={styles.fieldLabel}>Complaints</Text>
                <Text style={styles.fieldValue}>{inspection.report.complaints}</Text>
              </View>

              <View style={styles.textFieldContainer}>
                <Text style={styles.fieldLabel}>Suggestions</Text>
                <Text style={styles.fieldValue}>{inspection.report.suggestions}</Text>
              </View>

              {/* Photos */}
              {inspection.report.photos && inspection.report.photos.length > 0 && (
                <View style={styles.photosContainer}>
                  <Text style={styles.fieldLabel}>Photos ({inspection.report.photos.length})</Text>
                  <View style={styles.photoGrid}>
                    {inspection.report.photos.map((photo, index) => (
                      <Image
                        key={index}
                        source={{ uri: `data:image/jpeg;base64,${photo}` }}
                        style={styles.photo}
                      />
                    ))}
                  </View>
                </View>
              )}

              <Text style={styles.submittedText}>
                Submitted on {new Date(inspection.report.submitted_at).toLocaleString()}
              </Text>
            </View>
          </View>
        )}

        {/* Office Response */}
        {inspection.office_response && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Office Response</Text>
            <View style={[styles.card, styles.responseCard]}>
              <Text style={styles.responseText}>
                {inspection.office_response.response_text}
              </Text>
              <Text style={styles.responseDate}>
                Responded on {new Date(inspection.office_response.responded_at).toLocaleString()}
              </Text>
            </View>
          </View>
        )}

        {/* Government Review */}
        {inspection.govt_review && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Government Review</Text>
            <View style={[styles.card, styles.reviewCard]}>
              <Text style={styles.responseText}>
                {inspection.govt_review.review_text}
              </Text>
              <Text style={styles.responseDate}>
                Reviewed on {new Date(inspection.govt_review.reviewed_at).toLocaleString()}
              </Text>
            </View>
          </View>
        )}

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.card}>
            {renderTimeline()}
          </View>
        </View>
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
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
  statusSection: {
    alignItems: 'center',
    padding: 16,
  },
  statusBadgeLarge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusTextLarge: {
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  ratingItem: {
    marginBottom: 16,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  textFieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  fieldValue: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  photosContainer: {
    marginTop: 8,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  submittedText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 16,
    fontStyle: 'italic',
  },
  responseCard: {
    backgroundColor: '#FFF9E6',
  },
  reviewCard: {
    backgroundColor: '#E6F7FF',
  },
  responseText: {
    fontSize: 14,
    color: '#1a1a1a',
    lineHeight: 20,
    marginBottom: 12,
  },
  responseDate: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  timelineContainer: {
    paddingVertical: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  timelineIconContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 4,
  },
  timelineLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  timelineDate: {
    fontSize: 13,
    color: '#8E8E93',
  },
});