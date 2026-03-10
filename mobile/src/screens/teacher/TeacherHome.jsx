import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { teacherAPI } from '../../services/api';
import StatsCard from '../../components/StatsCard';

export default function TeacherHome({ navigation }) {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchDashboard = useCallback(async () => {
    try {
      setError('');
      const data = await teacherAPI.getDashboard();
      setDashboard(data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  function onRefresh() {
    setRefreshing(true);
    fetchDashboard();
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4338CA" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4338CA']} />}
    >
      <View style={styles.welcomeBox}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.name}>{user?.name || 'Teacher'}</Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchDashboard}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.statsRow}>
        <StatsCard title="My Classes" value={dashboard?.classCount ?? '—'} color="#4338CA" />
        <StatsCard title="Today's Sessions" value={dashboard?.todaySessions ?? '—'} color="#0891B2" />
      </View>
      <View style={styles.statsRow}>
        <StatsCard title="Students Present" value={dashboard?.presentToday ?? '—'} color="#059669" />
        <StatsCard title="Avg Attendance" value={dashboard?.avgAttendance ? `${dashboard.avgAttendance}%` : '—'} color="#D97706" />
      </View>

      {dashboard?.activeSession ? (
        <View style={styles.activeCard}>
          <View style={styles.activeIndicator} />
          <View style={styles.activeContent}>
            <Text style={styles.activeTitle}>Active Session</Text>
            <Text style={styles.activeClass}>{dashboard.activeSession.className}</Text>
            <Text style={styles.activeInfo}>
              {dashboard.activeSession.presentCount} students present
            </Text>
          </View>
        </View>
      ) : null}

      <TouchableOpacity
        style={styles.startButton}
        onPress={() => navigation.navigate('Sessions')}
        activeOpacity={0.8}
      >
        <Text style={styles.startButtonText}>Start New Session</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      {[
        { label: 'Start Attendance Session', screen: 'Sessions' },
        { label: 'View Reports', screen: 'Reports' },
      ].map((action) => (
        <TouchableOpacity
          key={action.screen}
          style={styles.actionItem}
          onPress={() => navigation.navigate(action.screen)}
        >
          <Text style={styles.actionText}>{action.label}</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F3FF' },
  content: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F3FF' },
  welcomeBox: {
    backgroundColor: '#4338CA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  greeting: { color: '#C7D2FE', fontSize: 14 },
  name: { color: '#FFFFFF', fontSize: 22, fontWeight: '700', marginTop: 2 },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    alignItems: 'center',
  },
  errorText: { color: '#DC2626', fontSize: 13 },
  retryText: { color: '#4338CA', fontSize: 13, fontWeight: '600', marginTop: 6 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  activeCard: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  activeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    marginRight: 12,
  },
  activeContent: { flex: 1 },
  activeTitle: { color: '#065F46', fontSize: 12, fontWeight: '600' },
  activeClass: { color: '#064E3B', fontSize: 16, fontWeight: '700', marginTop: 2 },
  activeInfo: { color: '#047857', fontSize: 13, marginTop: 2 },
  startButton: {
    backgroundColor: '#4338CA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  startButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E1B4B',
    marginBottom: 10,
  },
  actionItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: { fontSize: 15, color: '#1E1B4B', fontWeight: '500' },
  actionArrow: { fontSize: 22, color: '#9CA3AF' },
});
