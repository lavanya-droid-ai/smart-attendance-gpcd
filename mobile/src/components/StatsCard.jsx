import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function StatsCard({ title, value, color = '#4338CA' }) {
  return (
    <View style={styles.card}>
      <View style={[styles.indicator, { backgroundColor: color }]} />
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 10,
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  title: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
});
