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

const STATUS_COLORS = {
  present: { bg: '#ECFDF5', text: '#059669' },
  late: { bg: '#FFFBEB', text: '#D97706' },
  absent: { bg: '#FEF2F2', text: '#DC2626' },
};

export default function StudentHistory() {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchHistory = useCallback(async () => {
    try {
      setError('');
      const [history, statsData] = await Promise.all([
        studentAPI.getAttendanceHistory({}),
        studentAPI.getAttendanceStats(),
      ]);
      setRecords(Array.isArray(history) ? history : history?.records || []);
      setStats(statsData);
    } catch (err) {
      setError(err.message || 'Failed to load history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  function onRefresh() {
    setRefreshing(true);
    fetchHistory();
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  function renderHeader() {
    if (!stats) return null;
    return (
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Overall Attendance</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {stats.overallPercentage ?? stats.percentage ?? '—'}%
            </Text>
            <Text style={styles.statLabel}>Percentage</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#059669' }]}>
              {stats.totalPresent ?? '—'}
            </Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#DC2626' }]}>
              {stats.totalAbsent ?? '—'}
            </Text>
            <Text style={styles.statLabel}>Absent</Text>
          </View>
        </View>

        {stats.percentage !== undefined && (
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${Math.min(stats.percentage || stats.overallPercentage || 0, 100)}%`,
                  backgroundColor:
                    (stats.percentage || stats.overallPercentage || 0) >= 75
                      ? '#059669'
                      : '#DC2626',
                },
              ]}
            />
          </View>
        )}
      </View>
    );
  }

  function renderItem({ item }) {
    const status = item.status || 'absent';
    const colors = STATUS_COLORS[status] || STATUS_COLORS.absent;

    return (
      <View style={styles.recordCard}>
        <View style={styles.recordLeft}>
          <Text style={styles.recordDate}>{formatDate(item.date)}</Text>
          <Text style={styles.recordClass}>
            {item.className || item.class?.name || 'Class'}
          </Text>
          {item.method ? (
            <Text style={styles.recordMethod}>via {item.method.toUpperCase()}</Text>
          ) : null}
        </View>
        <View style={[styles.recordBadge, { backgroundColor: colors.bg }]}>
          <Text style={[styles.recordBadgeText, { color: colors.text }]}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Text>
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
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={records}
        keyExtractor={(item, index) => item._id || String(index)}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4338CA']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No History</Text>
            <Text style={styles.emptySubtitle}>
              Your attendance records will appear here.
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
  list: { padding: 16, paddingBottom: 32 },
  statsCard: {
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
  statsTitle: { fontSize: 18, fontWeight: '700', color: '#1E1B4B', marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', color: '#4338CA' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: { height: '100%', borderRadius: 4 },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  recordLeft: { flex: 1 },
  recordDate: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  recordClass: { fontSize: 15, fontWeight: '600', color: '#1E1B4B', marginTop: 2 },
  recordMethod: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  recordBadge: { borderRadius: 14, paddingVertical: 4, paddingHorizontal: 12, marginLeft: 12 },
  recordBadgeText: { fontSize: 12, fontWeight: '700' },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    margin: 16,
    marginBottom: 0,
  },
  errorText: { color: '#DC2626', fontSize: 13, textAlign: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1E1B4B' },
  emptySubtitle: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },
});
