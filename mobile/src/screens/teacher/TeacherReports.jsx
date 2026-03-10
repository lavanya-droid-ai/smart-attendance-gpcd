import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { teacherAPI } from '../../services/api';

export default function TeacherReports() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadClasses();
  }, []);

  async function loadClasses() {
    try {
      const data = await teacherAPI.getClasses();
      setClasses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  }

  async function loadReport(cls) {
    setSelectedClass(cls);
    setReportLoading(true);
    setError('');
    try {
      const data = await teacherAPI.getReports(cls._id, {});
      setReport(data);
    } catch (err) {
      setError(err.message || 'Failed to load report');
      setReport(null);
    } finally {
      setReportLoading(false);
    }
  }

  function openWebApp() {
    Linking.openURL('https://smart-attendance-gpcd.onrender.com/teacher/reports');
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4338CA" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Attendance Reports</Text>
      <Text style={styles.description}>
        Select a class to view basic stats. Open the web app for detailed reports.
      </Text>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <Text style={styles.label}>Select Class</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {classes.map((cls) => (
          <TouchableOpacity
            key={cls._id}
            style={[styles.chip, selectedClass?._id === cls._id && styles.chipSelected]}
            onPress={() => loadReport(cls)}
          >
            <Text
              style={[
                styles.chipText,
                selectedClass?._id === cls._id && styles.chipTextSelected,
              ]}
            >
              {cls.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {reportLoading ? (
        <ActivityIndicator size="large" color="#4338CA" style={{ marginTop: 30 }} />
      ) : report ? (
        <View style={styles.reportCard}>
          <Text style={styles.reportTitle}>{selectedClass?.name}</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{report.totalSessions ?? '—'}</Text>
              <Text style={styles.statLabel}>Total Sessions</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{report.totalStudents ?? '—'}</Text>
              <Text style={styles.statLabel}>Students</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#059669' }]}>
                {report.avgAttendance ? `${report.avgAttendance}%` : '—'}
              </Text>
              <Text style={styles.statLabel}>Avg Attendance</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#D97706' }]}>
                {report.lowAttendanceCount ?? '—'}
              </Text>
              <Text style={styles.statLabel}>Low Attendance</Text>
            </View>
          </View>
        </View>
      ) : selectedClass ? (
        <Text style={styles.emptyText}>No report data available</Text>
      ) : null}

      <TouchableOpacity style={styles.webButton} onPress={openWebApp} activeOpacity={0.8}>
        <Text style={styles.webButtonText}>Open Detailed Reports in Browser</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F3FF' },
  content: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F3FF' },
  title: { fontSize: 22, fontWeight: '700', color: '#1E1B4B', marginBottom: 4 },
  description: { fontSize: 14, color: '#6B7280', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  chipRow: { marginBottom: 20 },
  chip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipSelected: { backgroundColor: '#4338CA', borderColor: '#4338CA' },
  chipText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  chipTextSelected: { color: '#FFFFFF' },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: '#DC2626', fontSize: 13, textAlign: 'center' },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  reportTitle: { fontSize: 18, fontWeight: '700', color: '#1E1B4B', marginBottom: 16 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    width: '47%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: { fontSize: 24, fontWeight: '800', color: '#4338CA' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  emptyText: { color: '#9CA3AF', textAlign: 'center', marginTop: 30, fontSize: 14 },
  webButton: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  webButtonText: { color: '#4338CA', fontSize: 15, fontWeight: '600' },
});
