// components/TimePicker.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

// Grid of tappable hour/minute buttons (like a phone alarm's time picker, no seconds).
// `value` is a "HH:MM" string; `onChange` is called with the new "HH:MM" string.
export default function TimePicker({ value, onChange }) {
  const [selectedHour, selectedMinute] = value ? value.split(':') : ['08', '00'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Heures</Text>
      <View style={styles.grid}>
        {HOURS.map((hour) => (
          <TimeButton
            key={hour}
            value={hour}
            isSelected={selectedHour === hour}
            onPress={() => onChange(`${hour}:${selectedMinute}`)}
          />
        ))}
      </View>

      <Text style={styles.label}>Minutes</Text>
      <View style={styles.grid}>
        {MINUTES.map((minute) => (
          <TimeButton
            key={minute}
            value={minute}
            isSelected={selectedMinute === minute}
            onPress={() => onChange(`${selectedHour}:${minute}`)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function TimeButton({ value, isSelected, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, isSelected && styles.buttonSelected]}
      activeOpacity={0.7}
    >
      <Text style={[styles.buttonText, isSelected && styles.buttonTextSelected]}>{value}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 360,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    margin: 16,
    marginBottom: 8,
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  content: {
    padding: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  button: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  buttonSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  buttonText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  buttonTextSelected: {
    color: '#ffffff',
  },
});
