import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { teacherAPI } from '../../services/api';
import { startBroadcasting, stopBroadcasting } from '../../services/ble';

export default function StartSession() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [duration, setDuration] = useState('60');
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const [classList, activeSessions] = await Promise.all([
        teacherAPI.getClasses(),
        teacherAPI.getActiveSessions(),
      ]);
      setClasses(Array.isArray(classList) ? classList : []);
      if (activeSessions && (Array.isArray(activeSessions) ? activeSessions.length > 0 : activeSessions._id)) {
        const session = Array.isArray(activeSessions) ? activeSessions[0] : activeSessions;
        setActiveSession(session);
        setAttendanceCount(session.presentCount || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(async () => {
      try {
        const data = await teacherAPI.getSessionAttendance(activeSession._id);
        setAttendanceCount(data?.length || data?.presentCount || attendanceCount);
      } catch {
        // Silently fail on poll errors
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [activeSession]);

  async function handleStart() {
    if (!selectedClass) {
      Alert.alert('Select Class', 'Please select a class first.');
      return;
    }

    setStarting(true);
    setError('');

    try {
      const session = await teacherAPI.startSession(selectedClass._id, {
        duration: parseInt(duration, 10) || 60,
      });
      setActiveSession(session);
      setAttendanceCount(0);

      if (session.bleToken) {
        await startBroadcasting(session.bleToken);
      }
    } catch (err) {
      setError(err.message || 'Failed to start session');
    } finally {
      setStarting(false);
    }
  }

  async function handleEnd() {
    Alert.alert('End Session', 'Are you sure you want to end this session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End',
        style: 'destructive',
        onPress: async () => {
          try {
            await stopBroadcasting();
            await teacherAPI.endSession(activeSession._id);
            setActiveSession(null);
            setAttendanceCount(0);
            setSelectedClass(null);
          } catch (err) {
            setError(err.message || 'Failed to end session');
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4338CA" />
      </View>
    );
  }

  if (activeSession) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.activeHeader}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Session Active</Text>
        </View>

        <View style={styles.sessionCard}>
          <Text style={styles.sessionClass}>
            {activeSession.className || activeSession.class?.name || 'Class Session'}
          </Text>

          <View style={styles.sessionMeta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>BLE Token</Text>
              <Text style={styles.metaValue} numberOfLines={1}>
                {activeSession.bleToken || 'Broadcasting...'}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Status</Text>
              <Text style={[styles.metaValue, { color: '#059669' }]}>Broadcasting</Text>
            </View>
          </View>

          <View style={styles.countBox}>
            <Text style={styles.countValue}>{attendanceCount}</Text>
            <Text style={styles.countLabel}>Students Present</Text>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.endButton} onPress={handleEnd} activeOpacity={0.8}>
          <Text style={styles.endButtonText}>End Session</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Start Attendance Session</Text>
      <Text style={styles.description}>
        Select a class and start a BLE-based attendance session.
      </Text>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <Text style={styles.label}>Select Class</Text>
      <View style={styles.classList}>
        {classes.length === 0 ? (
          <Text style={styles.emptyText}>No classes assigned</Text>
        ) : (
          classes.map((cls) => (
            <TouchableOpacity
              key={cls._id}
              style={[
                styles.classItem,
                selectedClass?._id === cls._id && styles.classItemSelected,
              ]}
              onPress={() => setSelectedClass(cls)}
            >
              <Text
                style={[
                  styles.classItemText,
                  selectedClass?._id === cls._id && styles.classItemTextSelected,
                ]}
              >
                {cls.name}
              </Text>
              {cls.subject ? (
                <Text
                  style={[
                    styles.classSubject,
                    selectedClass?._id === cls._id && styles.classSubjectSelected,
                  ]}
                >
                  {cls.subject}
                </Text>
              ) : null}
            </TouchableOpacity>
          ))
        )}
      </View>

      <Text style={styles.label}>Duration (minutes)</Text>
      <TextInput
        style={styles.input}
        value={duration}
        onChangeText={setDuration}
        keyboardType="numeric"
        placeholder="60"
        placeholderTextColor="#9CA3AF"
      />

      <TouchableOpacity
        style={[styles.startButton, (starting || !selectedClass) && styles.buttonDisabled]}
        onPress={handleStart}
        disabled={starting || !selectedClass}
        activeOpacity={0.8}
      >
        {starting ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.startButtonText}>Start Session</Text>
        )}
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
  classList: { marginBottom: 20 },
  classItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  classItemSelected: {
    borderColor: '#4338CA',
    backgroundColor: '#EEF2FF',
  },
  classItemText: { fontSize: 16, fontWeight: '600', color: '#1E1B4B' },
  classItemTextSelected: { color: '#4338CA' },
  classSubject: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  classSubjectSelected: { color: '#6366F1' },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1F2937',
    marginBottom: 20,
  },
  startButton: {
    backgroundColor: '#4338CA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  startButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: '#DC2626', fontSize: 13, textAlign: 'center' },
  emptyText: { color: '#9CA3AF', fontSize: 14, textAlign: 'center', padding: 20 },

  // Active session styles
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    marginRight: 8,
  },
  liveText: { fontSize: 16, fontWeight: '700', color: '#DC2626' },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  sessionClass: { fontSize: 20, fontWeight: '700', color: '#1E1B4B', marginBottom: 16 },
  sessionMeta: { gap: 12, marginBottom: 20 },
  metaItem: {},
  metaLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  metaValue: { fontSize: 14, color: '#1E1B4B', marginTop: 2 },
  countBox: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  countValue: { fontSize: 40, fontWeight: '800', color: '#4338CA' },
  countLabel: { fontSize: 14, color: '#6366F1', marginTop: 4 },
  endButton: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  endButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
