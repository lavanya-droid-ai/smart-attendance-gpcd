import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export default function BleStatusBanner({ scanning, detected, marking }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (scanning) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
    pulseAnim.setValue(1);
  }, [scanning, pulseAnim]);

  if (!scanning && !detected && !marking) return null;

  if (marking) {
    return (
      <View style={[styles.banner, styles.bannerMarking]}>
        <View style={styles.row}>
          <View style={[styles.dot, { backgroundColor: '#D97706' }]} />
          <Text style={[styles.text, { color: '#92400E' }]}>Verifying identity...</Text>
        </View>
      </View>
    );
  }

  if (detected) {
    return (
      <View style={[styles.banner, styles.bannerDetected]}>
        <View style={styles.row}>
          <View style={[styles.dot, { backgroundColor: '#059669' }]} />
          <Text style={[styles.text, { color: '#065F46' }]}>Class detected! Verifying...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.banner, styles.bannerScanning]}>
      <View style={styles.row}>
        <Animated.View style={[styles.dot, styles.scanningDot, { opacity: pulseAnim }]} />
        <Text style={[styles.text, { color: '#1E1B4B' }]}>Scanning for BLE beacons...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  bannerScanning: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  bannerDetected: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  bannerMarking: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  scanningDot: {
    backgroundColor: '#4338CA',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
});
