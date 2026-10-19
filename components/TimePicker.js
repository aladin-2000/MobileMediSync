// components/TimePicker.js
import React from 'react';
import { Platform, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

// `value`/`onChange` are "HH:MM" strings. Uses the OS's own time picker instead of a
// custom widget: a native dialog on Android (opens/closes itself), a spinner wrapped
// in a small card on iOS (the iOS spinner has no dismiss chrome of its own).
export default function TimePicker({ visible, value, onChange, onClose }) {
  if (!visible) return null;

  const [hour, minute] = value ? value.split(':').map(Number) : [8, 0];
  const date = new Date();
  date.setHours(hour, minute, 0, 0);

  const handleChange = (event, selectedDate) => {
    if (Platform.OS === 'android') onClose();
    if (event.type !== 'dismissed' && selectedDate) {
      const hh = String(selectedDate.getHours()).padStart(2, '0');
      const mm = String(selectedDate.getMinutes()).padStart(2, '0');
      onChange(`${hh}:${mm}`);
    }
  };

  if (Platform.OS === 'android') {
    return <DateTimePicker value={date} mode="time" is24Hour display="default" onChange={handleChange} />;
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.card}>
          <DateTimePicker value={date} mode="time" is24Hour display="spinner" onChange={handleChange} />
          <TouchableOpacity style={styles.doneButton} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.doneButtonText}>OK</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 24,
  },
  doneButton: {
    marginTop: 8,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});
