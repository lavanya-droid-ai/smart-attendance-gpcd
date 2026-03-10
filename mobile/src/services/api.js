import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'https://smart-attendance-gpcd.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    if (response.data && response.data.success !== undefined) {
      return response.data.data !== undefined ? response.data.data : response.data;
    }
    return response.data;
  },
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('authToken');
    }
    const message =
      error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export const authAPI = {
  login: (email, password, deviceId) =>
    api.post('/auth/login', { email, password, deviceId }),
  getProfile: () => api.get('/auth/profile'),
  changePassword: (currentPassword, newPassword) =>
    api.put('/auth/change-password', { currentPassword, newPassword }),
};

export const teacherAPI = {
  getClasses: () => api.get('/teacher/classes'),
  getClassStudents: (classId) => api.get(`/teacher/classes/${classId}/students`),
  startSession: (classId, data) =>
    api.post(`/teacher/classes/${classId}/sessions`, data),
  endSession: (sessionId) => api.put(`/teacher/sessions/${sessionId}/end`),
  getActiveSessions: () => api.get('/teacher/sessions/active'),
  getSessionAttendance: (sessionId) =>
    api.get(`/teacher/sessions/${sessionId}/attendance`),
  getDashboard: () => api.get('/teacher/dashboard'),
  getReports: (classId, params) =>
    api.get(`/teacher/classes/${classId}/reports`, { params }),
};

export const studentAPI = {
  markAttendance: (data) => api.post('/student/attendance/mark', data),
  getTodayAttendance: () => api.get('/student/attendance/today'),
  getAttendanceHistory: (params) =>
    api.get('/student/attendance/history', { params }),
  getDashboard: () => api.get('/student/dashboard'),
  getAttendanceStats: () => api.get('/student/attendance/stats'),
};

export default api;
