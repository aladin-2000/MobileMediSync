// components/TimePicker.js
import React, { useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));
const ROW_HEIGHT = 40;
const VISIBLE_ROWS = 5;

// Two scrollable columns (heures / minutes par pas de 5) — plus fluide et compact
// qu'une grille affichant les 24 heures et les 60 minutes d'un coup.
// `value` is a "HH:MM" string; `onChange` is called with the new "HH:MM" string.
export default function TimePicker({ value, onChange }) {
  const [selectedHour, selectedMinute] = value ? value.split(':') : ['08', '00'];

  return (
    <View style={styles.container}>
      <View style={styles.columnsRow}>
        <TimeColumn
          label="Heures"
          values={HOURS}
          selected={selectedHour}
          onSelect={(hour) => onChange(`${hour}:${selectedMinute}`)}
        />
        <TimeColumn
          label="Minutes"
          values={MINUTES}
          selected={selectedMinute}
          onSelect={(minute) => onChange(`${selectedHour}:${minute}`)}
        />
      </View>
    </View>
  );
}

function TimeColumn({ label, values, selected, onSelect }) {
  const scrollRef = useRef(null);
  const didInitialScroll = useRef(false);

  const handleLayout = () => {
    if (didInitialScroll.current) return;
    didInitialScroll.current = true;
    const index = Math.max(0, values.indexOf(selected));
    scrollRef.current?.scrollTo({ y: index * ROW_HEIGHT, animated: false });
  };

  return (
    <View style={styles.column}>
      <Text style={styles.columnLabel}>{label}</Text>
      <View style={styles.columnWindow}>
        <ScrollView
          ref={scrollRef}
          onLayout={handleLayout}
          showsVerticalScrollIndicator={false}
          snapToInterval={ROW_HEIGHT}
          decelerationRate="fast"
        >
          {values.map((v) => (
            <TouchableOpacity
              key={v}
              style={[styles.row, v === selected && styles.rowSelected]}
              onPress={() => onSelect(v)}
              activeOpacity={0.7}
            >
              <Text style={[styles.rowText, v === selected && styles.rowTextSelected]}>{v}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    margin: 16,
    marginBottom: 8,
    padding: 16,
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  columnsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  column: {
    flex: 1,
  },
  columnLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  columnWindow: {
    height: ROW_HEIGHT * VISIBLE_ROWS,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  row: {
    height: ROW_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowSelected: {
    backgroundColor: '#eff6ff',
  },
  rowText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },
  rowTextSelected: {
    color: '#1d4ed8',
    fontWeight: '800',
  },
});
