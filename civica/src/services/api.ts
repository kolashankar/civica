import axios from 'axios';
import type { LoginCredentials, AuthResponse, User, School, Office, Team, Template, Inspection } from '../types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
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

  register: async (data: any): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Schools API
export const schoolsApi = {
  getAll: async (params?: any) => {
    const response = await api.get('/schools', { params });
    return response.data;
  },

  getById: async (id: string): Promise<School> => {
    const response = await api.get(`/schools/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/schools', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/schools/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/schools/${id}`);
    return response.data;
  },

  activate: async (id: string) => {
    const response = await api.post(`/schools/${id}/activate`);
    return response.data;
  },
};

// Offices API
export const officesApi = {
  getAll: async (params?: any) => {
    const response = await api.get('/offices', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Office> => {
    const response = await api.get(`/offices/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/offices', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/offices/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/offices/${id}`);
    return response.data;
  },

  activate: async (id: string) => {
    const response = await api.post(`/offices/${id}/activate`);
    return response.data;
  },
};

// Users API
export const usersApi = {
  getAll: async (params?: any) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  getById: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/users', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  activate: async (id: string) => {
    const response = await api.post(`/users/${id}/activate`);
    return response.data;
  },

  bulkImport: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/users/bulk-import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// Teams API
export const teamsApi = {
  getAll: async (params?: any) => {
    const response = await api.get('/teams', { params });
    return response.data;
  },

  getBySchool: async (schoolId: string) => {
    const response = await api.get(`/teams/school/${schoolId}`);
    return response.data;
  },

  getById: async (id: string): Promise<Team> => {
    const response = await api.get(`/teams/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/teams', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/teams/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/teams/${id}`);
    return response.data;
  },

  activate: async (id: string) => {
    const response = await api.post(`/teams/${id}/activate`);
    return response.data;
  },
};

// Templates API
export const templatesApi = {
  getAll: async (params?: any) => {
    const response = await api.get('/templates', { params });
    return response.data;
  },

  getAllActive: async (officeType?: string) => {
    const params = officeType ? { office_type: officeType } : {};
    const response = await api.get('/templates/all', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Template> => {
    const response = await api.get(`/templates/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/templates', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/templates/${id}`, data);
    return response.data;
  },

  clone: async (id: string, newName: string) => {
    const response = await api.post(`/templates/${id}/clone`, { new_name: newName });
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/templates/${id}`);
    return response.data;
  },

  activate: async (id: string) => {
    const response = await api.post(`/templates/${id}/activate`);
    return response.data;
  },
};

// Inspections API
export const inspectionsApi = {
  getAll: async (params?: any) => {
    const response = await api.get('/inspections', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Inspection> => {
    const response = await api.get(`/inspections/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/inspections', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/inspections/${id}`, data);
    return response.data;
  },

  reassign: async (id: string, teamId: string) => {
    const response = await api.post(`/inspections/${id}/reassign`, { team_id: teamId });
    return response.data;
  },

  overrideStatus: async (id: string, status: string, reason: string) => {
    const response = await api.post(`/inspections/${id}/override-status`, { status, reason });
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/inspections/${id}`);
    return response.data;
  },

  approveReport: async (id: string, data: { approved: boolean; comments: string }) => {
    const response = await api.post(`/inspections/${id}/approve`, data);
    return response.data;
  },
};

// Analytics API
export const analyticsApi = {
  getGlobalStats: async () => {
    const response = await api.get('/analytics/global');
    return response.data;
  },

  getTrends: async (days: number = 30) => {
    const response = await api.get('/analytics/trends', { params: { days } });
    return response.data;
  },

  getSchoolPerformance: async () => {
    const response = await api.get('/analytics/schools');
    return response.data;
  },

  getOfficeCompliance: async () => {
    const response = await api.get('/analytics/offices');
    return response.data;
  },

  getStatusDistribution: async () => {
    const response = await api.get('/analytics/status-distribution');
    return response.data;
  },
  
  // School-specific analytics for headmasters
  getSchoolAnalytics: async (schoolId: string) => {
    const response = await api.get(`/analytics/school/${schoolId}`);
    return response.data;
  },
  
  getSchoolActivity: async (schoolId: string, days: number = 7) => {
    const response = await api.get(`/analytics/school/${schoolId}/activity`, { params: { days } });
    return response.data;
  },
};

// Students API (for headmasters)
export const studentsApi = {
  getBySchool: async (schoolId: string, params?: any) => {
    const response = await api.get(`/students/school/${schoolId}`, { params });
    return response.data;
  },
  
  getPerformance: async (studentId: string) => {
    const response = await api.get(`/students/${studentId}/performance`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/students', data);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/students/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/students/${id}`);
    return response.data;
  },
  
  activate: async (id: string) => {
    const response = await api.post(`/students/${id}/activate`);
    return response.data;
  },
};

// Notifications API
export const notificationsApi = {
  getAll: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await api.post(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.post('/notifications/mark-all-read');
    return response.data;
  },
};

// Office API (for office users)
export const officeApi = {
  getInspections: async (officeId: string, params?: any) => {
    const response = await api.get(`/inspections/office/${officeId}`, { params });
    return response.data;
  },

  getStats: async (officeId: string) => {
    const response = await api.get(`/inspections/office/${officeId}/stats`);
    return response.data;
  },

  submitResponse: async (inspectionId: string, data: any) => {
    const response = await api.post(`/inspections/${inspectionId}/office-response`, data);
    return response.data;
  },

  editResponse: async (inspectionId: string, data: any) => {
    const response = await api.put(`/inspections/${inspectionId}/office-response`, data);
    return response.data;
  },

  getHistory: async (officeId: string, params?: any) => {
    const response = await api.get(`/inspections/office/${officeId}/history`, { params });
    return response.data;
  },

  getAnalytics: async (officeId: string, days: number = 30) => {
    const response = await api.get(`/inspections/office/${officeId}/analytics`, { params: { days } });
    return response.data;
  },
};

export default api;