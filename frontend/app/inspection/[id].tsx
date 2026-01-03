import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { inspectionsApi } from '../../services/api';
import { Inspection } from '../../types';

export default function InspectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [inspection, setInspection] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    loadInspection();
    checkDraft();
  }, [id]);

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

  const checkDraft = async () => {
    if (!id) return;

    try {
      const draftKey = `inspection_draft_${id}`;
      const draft = await AsyncStorage.getItem(draftKey);
      setHasDraft(!!draft);
    } catch (error) {
      console.error('Failed to check draft:', error);
    }
  };

  const handleStartInspection = () => {
    router.push(`/inspection/form/${id}`);
  };

  const handleViewReport = () => {
    // If inspection has been submitted, show the submitted report
    Alert.alert('Submitted', 'Inspection has been submitted');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!inspection) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
        <Text style={styles.errorText}>Inspection not found</Text>
      </View>
    );
  }

  const canEdit = inspection.status === 'assigned';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inspection Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Inspection Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.taskName}>{inspection.task_name}</Text>
          <Text style={styles.taskDescription}>{inspection.task_description}</Text>

          {inspection.office && (
            <View style={styles.officeInfo}>
              <Text style={styles.sectionTitle}>Office Information</Text>

              <View style={styles.infoRow}>
                <Ionicons name="business" size={20} color="#007AFF" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Office Name</Text>
                  <Text style={styles.infoValue}>{inspection.office.name}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="pricetag" size={20} color="#007AFF" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Type</Text>
                  <Text style={styles.infoValue}>{inspection.office.type.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="location" size={20} color="#007AFF" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Address</Text>
                  <Text style={styles.infoValue}>
                    {inspection.office.address}, {inspection.office.district}, {inspection.office.state}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="person" size={20} color="#007AFF" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Contact Person</Text>
                  <Text style={styles.infoValue}>{inspection.office.contact_person}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="call" size={20} color="#007AFF" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{inspection.office.contact_phone}</Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.divider} />

          {/* Task Information */}
          <View style={styles.taskInfo}>
            <Text style={styles.sectionTitle}>Task Information</Text>

            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={20} color="#007AFF" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Assigned Date</Text>
                <Text style={styles.infoValue}>
                  {new Date(inspection.assigned_date).toLocaleDateString()}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="time" size={20} color="#007AFF" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Due Date</Text>
                <Text style={styles.infoValue}>
                  {new Date(inspection.due_date).toLocaleDateString()}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="flag" size={20} color="#FF9500" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Priority</Text>
                <Text style={[styles.infoValue, { color: inspection.priority === 'high' ? '#FF3B30' : '#007AFF' }]}>
                  {inspection.priority.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    inspection.status === 'assigned'
                      ? '#007AFF15'
                      : inspection.status === 'submitted'
                      ? '#34C75915'
                      : '#8E8E9315',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      inspection.status === 'assigned'
                        ? '#007AFF'
                        : inspection.status === 'submitted'
                        ? '#34C759'
                        : '#8E8E93',
                  },
                ]}
              >
                {inspection.status.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Team Information */}
        {inspection.team && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Team Information</Text>
            <View style={styles.infoRow}>
              <Ionicons name="people" size={20} color="#007AFF" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Team Name</Text>
                <Text style={styles.infoValue}>{inspection.team.name}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Action Button */}
        {canEdit ? (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleStartInspection}
            activeOpacity={0.8}
          >
            <Ionicons name="clipboard" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>
              {hasDraft ? 'Continue Inspection' : 'Start Inspection'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.submittedCard}>
            <Ionicons name="checkmark-circle" size={48} color="#34C759" />
            <Text style={styles.submittedTitle}>Inspection Submitted</Text>
            <Text style={styles.submittedText}>
              This inspection has been submitted. The office will review and respond soon.
            </Text>
          </View>
        )}
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
    fontSize: 18,
    color: '#FF3B30',
    marginTop: 16,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  infoCard: {
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
  taskName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  taskDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
    marginTop: 8,
  },
  officeInfo: {
    gap: 16,
  },
  taskInfo: {
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 20,
  },
  statusContainer: {
    marginTop: 20,
    alignItems: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
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
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    marginBottom: 16,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  submittedCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  submittedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  submittedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});
