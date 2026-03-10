import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { studentAPI } from '../../services/api';

const STATUS_CONFIG = {
  present: { bg: '#ECFDF5', text: '#059669', label: 'Present' },
  late: { bg: '#FFFBEB', text: '#D97706', label: 'Late' },
  absent: { bg: '#FEF2F2', text: '#DC2626', label: 'Absent' },
};

const METHOD_LABELS = {
  ble: 'BLE',
  nfc: 'NFC',
  manual: 'Manual',
};

export default function AttendanceStatus() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchToday = useCallback(async () => {
    try {
      setError('');
      const data = await studentAPI.getTodayAttendance();
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  function onRefresh() {
    setRefreshing(true);
    fetchToday();
  }

  function renderItem({ item }) {
    const status = item.status || 'absent';
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.absent;
    const method = item.method ? METHOD_LABELS[item.method] || item.method : null;

    return (
      <View style={styles.card}>
        <View style={styles.cardLeft}>
          <Text style={styles.className}>{item.className || item.class?.name || 'Class'}</Text>
          {item.time ? <Text style={styles.time}>{item.time}</Text> : null}
          {item.teacherName ? (
            <Text style={styles.teacher}>{item.teacherName}</Text>
          ) : null}
        </View>
        <View style={styles.cardRight}>
          <View style={[styles.badge, { backgroundColor: config.bg }]}>
            <Text style={[styles.badgeText, { color: config.text }]}>{config.label}</Text>
          </View>
          {method ? (
            <View style={styles.methodBadge}>
              <Text style={styles.methodText}>{method}</Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4338CA" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's Attendance</Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={records}
        keyExtractor={(item, index) => item._id || String(index)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4338CA']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Classes Today</Text>
            <Text style={styles.emptySubtitle}>
              You don't have any scheduled classes today.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F3FF' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F3FF' },
  header: { padding: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: '#1E1B4B' },
  date: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  list: { padding: 16, paddingTop: 8 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLeft: { flex: 1 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  className: { fontSize: 16, fontWeight: '600', color: '#1E1B4B' },
  time: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  teacher: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  badge: { borderRadius: 14, paddingVertical: 4, paddingHorizontal: 12 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  methodBadge: {
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  methodText: { fontSize: 10, fontWeight: '600', color: '#4338CA' },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  errorText: { color: '#DC2626', fontSize: 13, textAlign: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1E1B4B' },
  emptySubtitle: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },
});
