import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    // Unwrap the API envelope: { success, data } → data lives at response.data
    if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
};

// ─── Admin ───────────────────────────────────────────────────────────────────
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  toggleUserStatus: (id) => api.patch(`/admin/users/${id}/toggle-status`),
  getClasses: (params) => api.get('/admin/classes', { params }),
  createClass: (data) => api.post('/admin/classes', data),
  updateClass: (id, data) => api.put(`/admin/classes/${id}`, data),
  enrollStudents: (classId, studentIds) =>
    api.post(`/admin/classes/${classId}/enroll`, { studentIds }),
  removeStudent: (classId, studentId) =>
    api.delete(`/admin/classes/${classId}/students/${studentId}`),
  getAnalytics: () => api.get('/admin/analytics'),
};

// ─── Teacher ─────────────────────────────────────────────────────────────────
export const teacherAPI = {
  getDashboard: () => api.get('/teacher/dashboard'),
  getMyClasses: () => api.get('/teacher/classes'),
  startSession: (data) => api.post('/teacher/sessions', data),
  endSession: (sessionId) => api.patch(`/teacher/sessions/${sessionId}/end`),
  getSessionAttendance: (sessionId) =>
    api.get(`/teacher/sessions/${sessionId}/attendance`),
  getLiveAttendance: (sessionId) =>
    api.get(`/teacher/sessions/${sessionId}/live`),
  markManual: (sessionId, data) =>
    api.post(`/teacher/sessions/${sessionId}/attendance`, data),
  markBulk: (sessionId, data) =>
    api.post(`/teacher/sessions/${sessionId}/attendance/bulk`, data),
  getAbsentStudents: (sessionId) =>
    api.get(`/teacher/sessions/${sessionId}/absent`),
  getClassReport: (classId, params) =>
    api.get(`/teacher/classes/${classId}/report`, { params }),
  exportAttendance: (classId, params) =>
    api.get(`/teacher/classes/${classId}/export`, { params, responseType: 'blob' }),
  getDailyReport: () => api.get('/teacher/daily-report'),
};

// ─── Student ─────────────────────────────────────────────────────────────────
export const studentAPI = {
  getDashboard: () => api.get('/student/dashboard'),
  markBle: (data) => api.post('/student/attendance/ble', data),
  markNfc: (data) => api.post('/student/attendance/nfc', data),
  getAttendance: (params) => api.get('/student/attendance', { params }),
  getTodayStatus: () => api.get('/student/attendance/today'),
  getStats: () => api.get('/student/attendance/stats'),
};

// ─── Parent ──────────────────────────────────────────────────────────────────
export const parentAPI = {
  getDashboard: () => api.get('/parent/dashboard'),
  getWardAttendance: (params) => api.get('/parent/ward/attendance', { params }),
  getWardCalendar: (params) => api.get('/parent/ward/calendar', { params }),
  getWardSummary: (params) => api.get('/parent/ward/summary', { params }),
};

export default api;
