import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { studentAPI } from '../../services/api';
import { startScanning, stopScanning, getStatus } from '../../services/ble';
import { authenticate as biometricAuth } from '../../services/biometric';
import { getCurrentLocation, isOnCampus } from '../../services/location';
import { getDeviceId } from '../../services/device';
import StatsCard from '../../components/StatsCard';
import BleStatusBanner from '../../components/BleStatusBanner';

export default function StudentHome({ navigation }) {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [todayClasses, setTodayClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [bleDetected, setBleDetected] = useState(false);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const [dash, today] = await Promise.all([
        studentAPI.getDashboard(),
        studentAPI.getTodayAttendance(),
      ]);
      setDashboard(dash);
      setTodayClasses(Array.isArray(today) ? today : []);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    return () => {
      stopScanning();
    };
  }, [fetchData]);

  function onRefresh() {
    setRefreshing(true);
    fetchData();
  }

  async function handleScan() {
    if (scanning) {
      await stopScanning();
      setScanning(false);
      setBleDetected(false);
      return;
    }

    setScanning(true);
    setBleDetected(false);

    await startScanning(async (token) => {
      setBleDetected(true);
      setScanning(false);
      await handleAttendanceFlow(token, 'ble');
    });
  }

  async function handleNfcFallback() {
    Alert.alert(
      'NFC Attendance',
      'Please tap your phone on the NFC reader provided by your teacher.',
      [{ text: 'OK' }]
    );
  }

  async function handleAttendanceFlow(token, method) {
    setMarking(true);
    try {
      const bioResult = await biometricAuth();
      if (!bioResult.success) {
        Alert.alert('Verification Failed', 'Biometric verification is required.');
        setMarking(false);
        return;
      }

      const location = await getCurrentLocation();
      const campusCheck = isOnCampus(location.latitude, location.longitude);
      if (!campusCheck.onCampus) {
        Alert.alert(
          'Not on Campus',
          `You appear to be ${campusCheck.distance}m from campus. Attendance can only be marked on campus.`
        );
        setMarking(false);
        return;
      }

      const deviceId = await getDeviceId();

      await studentAPI.markAttendance({
        bleToken: token,
        method,
        latitude: location.latitude,
        longitude: location.longitude,
        deviceId,
      });

      Alert.alert('Success', 'Attendance marked successfully!');
      fetchData();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to mark attendance');
    } finally {
      setMarking(false);
    }
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
        <Text style={styles.name}>{user?.name || 'Student'}</Text>
        {dashboard?.overallPercentage !== undefined && (
          <View style={styles.percentBadge}>
            <Text style={styles.percentText}>{dashboard.overallPercentage}% Overall</Text>
          </View>
        )}
      </View>

      <BleStatusBanner
        scanning={scanning}
        detected={bleDetected}
        marking={marking}
      />

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.statsRow}>
        <StatsCard
          title="Today Present"
          value={dashboard?.todayPresent ?? '—'}
          color="#059669"
        />
        <StatsCard
          title="Total Classes"
          value={dashboard?.totalClasses ?? '—'}
          color="#4338CA"
        />
      </View>

      <TouchableOpacity
        style={[styles.scanButton, scanning && styles.scanButtonActive]}
        onPress={handleScan}
        disabled={marking}
        activeOpacity={0.8}
      >
        <Text style={styles.scanButtonText}>
          {scanning ? 'Stop Scanning' : 'Scan for Classes'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.nfcButton}
        onPress={handleNfcFallback}
        disabled={marking}
        activeOpacity={0.8}
      >
        <Text style={styles.nfcButtonText}>NFC Tap (Fallback)</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Today's Classes</Text>
      {todayClasses.length === 0 ? (
        <Text style={styles.emptyText}>No classes today</Text>
      ) : (
        todayClasses.map((item, index) => (
          <View key={item._id || index} style={styles.classCard}>
            <View style={styles.classInfo}>
              <Text style={styles.className}>{item.className || item.class?.name || 'Class'}</Text>
              <Text style={styles.classTime}>{item.time || ''}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                item.status === 'present' && styles.statusPresent,
                item.status === 'late' && styles.statusLate,
                !item.status && styles.statusPending,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  item.status === 'present' && styles.statusPresentText,
                  item.status === 'late' && styles.statusLateText,
                  !item.status && styles.statusPendingText,
                ]}
              >
                {item.status === 'present' ? 'Present' : item.status === 'late' ? 'Late' : 'Not Marked'}
              </Text>
            </View>
          </View>
        ))
      )}
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
    marginBottom: 16,
  },
  greeting: { color: '#C7D2FE', fontSize: 14 },
  name: { color: '#FFFFFF', fontSize: 22, fontWeight: '700', marginTop: 2 },
  percentBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  percentText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { color: '#DC2626', fontSize: 13, textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  scanButton: {
    backgroundColor: '#4338CA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  scanButtonActive: { backgroundColor: '#DC2626' },
  scanButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  nfcButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  nfcButtonText: { color: '#4338CA', fontSize: 15, fontWeight: '600' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1E1B4B', marginBottom: 10 },
  emptyText: { color: '#9CA3AF', fontSize: 14, textAlign: 'center', marginTop: 10 },
  classCard: {
    backgroundColor: '#FFFFFF',
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
    elevation: 2,
  },
  classInfo: { flex: 1 },
  className: { fontSize: 15, fontWeight: '600', color: '#1E1B4B' },
  classTime: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  statusBadge: {
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginLeft: 12,
  },
  statusPresent: { backgroundColor: '#ECFDF5' },
  statusLate: { backgroundColor: '#FFFBEB' },
  statusPending: { backgroundColor: '#F3F4F6' },
  statusText: { fontSize: 12, fontWeight: '600' },
  statusPresentText: { color: '#059669' },
  statusLateText: { color: '#D97706' },
  statusPendingText: { color: '#9CA3AF' },
});
