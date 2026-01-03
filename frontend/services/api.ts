import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { AuthResponse, LoginCredentials, SignupData, School, Inspection, Notification, UserStats } from '../types';

const API_URL = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_BACKEND_URL || '';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear storage
      await AsyncStorage.multiRemove(['auth_token', 'user_data']);
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (userData: SignupData): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  getMe: async (): Promise<any> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  getSchools: async (): Promise<School[]> => {
    const response = await api.get('/auth/schools');
    return response.data;
  },

  updateProfile: async (profileData: { name?: string; phone?: string; profile_image?: string }): Promise<any> => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<any> => {
    const response = await api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },

  getStats: async (): Promise<UserStats> => {
    const response = await api.get('/auth/stats');
    return response.data;
  },
};

// Inspections API
export const inspectionsApi = {
  getTeamInspections: async (teamId: string): Promise<Inspection[]> => {
    const response = await api.get(`/inspections/team/${teamId}`);
    return response.data;
  },

  getInspectionDetail: async (inspectionId: string): Promise<Inspection> => {
    const response = await api.get(`/inspections/${inspectionId}`);
    return response.data;
  },

  submitInspection: async (inspectionId: string, reportData: any): Promise<any> => {
    const response = await api.post(`/inspections/${inspectionId}/submit`, reportData);
    return response.data;
  },

  getTeamHistory: async (teamId: string): Promise<Inspection[]> => {
    const response = await api.get(`/inspections/history/${teamId}`);
    return response.data;
  },
};

// Notifications API
export const notificationsApi = {
  getNotifications: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications');
    return response.data;
  },

  getUnreadCount: async (): Promise<{ unread_count: number }> => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (notificationId: string): Promise<any> => {
    const response = await api.post(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<any> => {
    const response = await api.post('/notifications/mark-all-read');
    return response.data;
  },
};

export default api;
