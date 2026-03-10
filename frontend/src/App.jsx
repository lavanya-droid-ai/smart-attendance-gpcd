import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import Login from './pages/Login';

import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminClasses from './pages/admin/Classes';
import AdminAnalytics from './pages/admin/Analytics';

import TeacherDashboard from './pages/teacher/Dashboard';
import Sessions from './pages/teacher/Sessions';
import LiveAttendance from './pages/teacher/LiveAttendance';
import Reports from './pages/teacher/Reports';
import DailyReport from './pages/teacher/DailyReport';

import StudentDashboard from './pages/student/Dashboard';
import StudentAttendance from './pages/student/Attendance';
import StudentStats from './pages/student/Stats';

import ParentDashboard from './pages/parent/Dashboard';
import ParentAttendance from './pages/parent/Attendance';
import ParentCalendar from './pages/parent/Calendar';

export default function App() {
  const { loading, isAuthenticated, user } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to={`/${user.role}`} replace />
          ) : (
            <Login />
          )
        }
      />

      {/* Admin */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute role="admin">
            <Layout>
              <Routes>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="classes" element={<AdminClasses />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Teacher */}
      <Route
        path="/teacher/*"
        element={
          <ProtectedRoute role="teacher">
            <Layout>
              <Routes>
                <Route index element={<TeacherDashboard />} />
                <Route path="sessions" element={<Sessions />} />
                <Route path="session/:sessionId/live" element={<LiveAttendance />} />
                <Route path="attendance" element={<DailyReport />} />
                <Route path="reports" element={<Reports />} />
                <Route path="*" element={<Navigate to="/teacher" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Student */}
      <Route
        path="/student/*"
        element={
          <ProtectedRoute role="student">
            <Layout>
              <Routes>
                <Route index element={<StudentDashboard />} />
                <Route path="attendance" element={<StudentAttendance />} />
                <Route path="stats" element={<StudentStats />} />
                <Route path="*" element={<Navigate to="/student" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Parent */}
      <Route
        path="/parent/*"
        element={
          <ProtectedRoute role="parent">
            <Layout>
              <Routes>
                <Route index element={<ParentDashboard />} />
                <Route path="attendance" element={<ParentAttendance />} />
                <Route path="calendar" element={<ParentCalendar />} />
                <Route path="*" element={<Navigate to="/parent" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
