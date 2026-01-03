import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { inspectionsApi } from '../../services/api';
import { Inspection } from '../../types';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadInspections();
  }, []);

  const loadInspections = async () => {
    if (!user?.team_id) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await inspectionsApi.getTeamInspections(user.team_id);
      setInspections(data);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load inspections');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInspections();
    setRefreshing(false);
  }, [user]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#FF3B30';
      case 'medium':
        return '#FF9500';
      case 'low':
        return '#34C759';
      default:
        return '#8E8E93';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned':
        return '#007AFF';
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

  const assignedInspections = inspections.filter(i => i.status === 'assigned');
  const submittedInspections = inspections.filter(i => i.status === 'submitted');

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!user?.team_id) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#8E8E93" />
          <Text style={styles.emptyTitle}>No Team Assigned</Text>
          <Text style={styles.emptySubtitle}>
            You need to be assigned to a team to view inspections.
            Please contact your school administrator.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]}!</Text>
          <Text style={styles.subtitle}>Here's your inspection overview</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#007AFF15' }]}>
              <Ionicons name="clipboard" size={24} color="#007AFF" />
            </View>
            <Text style={styles.statValue}>{inspections.length}</Text>
            <Text style={styles.statLabel}>Total Tasks</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#FF950015' }]}>
              <Ionicons name="time" size={24} color="#FF9500" />
            </View>
            <Text style={styles.statValue}>{assignedInspections.length}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#34C75915' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#34C759" />
            </View>
            <Text style={styles.statValue}>{submittedInspections.length}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        {/* Assigned Inspections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assigned Inspections</Text>
          {assignedInspections.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="checkmark-done" size={48} color="#34C759" />
              <Text style={styles.emptyCardText}>No pending inspections</Text>
            </View>
          ) : (
            assignedInspections.map((inspection) => (
              <TouchableOpacity
                key={inspection._id}
                style={styles.inspectionCard}
                onPress={() => router.push(`/inspection/${inspection._id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleContainer}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {inspection.task_name}
                    </Text>
                    <View
                      style={[
                        styles.priorityBadge,
                        { backgroundColor: `${getPriorityColor(inspection.priority)}15` },
                      ]}
                    >
                      <Text
                        style={[
                          styles.priorityText,
                          { color: getPriorityColor(inspection.priority) },
                        ]}
                      >
                        {inspection.priority.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.cardDescription} numberOfLines={2}>
                  {inspection.task_description}
                </Text>

                {inspection.office && (
                  <View style={styles.cardLocation}>
                    <Ionicons name="location" size={16} color="#8E8E93" />
                    <Text style={styles.cardLocationText} numberOfLines={1}>
                      {inspection.office.name}
                    </Text>
                  </View>
                )}

                <View style={styles.cardFooter}>
                  <View style={styles.dueDateContainer}>
                    <Ionicons name="calendar" size={16} color="#8E8E93" />
                    <Text style={styles.dueDate}>
                      Due: {new Date(inspection.due_date).toLocaleDateString()}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: `${getStatusColor(inspection.status)}15` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(inspection.status) },
                      ]}
                    >
                      {inspection.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Recent Submissions */}
        {submittedInspections.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Submissions</Text>
            {submittedInspections.slice(0, 3).map((inspection) => (
              <TouchableOpacity
                key={inspection._id}
                style={styles.submittedCard}
                onPress={() => router.push(`/inspection/${inspection._id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.submittedCardContent}>
                  <Ionicons name="checkmark-circle" size={24} color="#34C759" />
                  <View style={styles.submittedCardText}>
                    <Text style={styles.submittedCardTitle} numberOfLines={1}>
                      {inspection.task_name}
                    </Text>
                    <Text style={styles.submittedCardSubtitle}>
                      Submitted • {new Date(inspection.assigned_date).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
              </TouchableOpacity>
            ))}
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
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  inspectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: 8,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  cardLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardLocationText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 4,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDate: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  submittedCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  submittedCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  submittedCardText: {
    marginLeft: 12,
    flex: 1,
  },
  submittedCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  submittedCardSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyCardText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 12,
  },
});
