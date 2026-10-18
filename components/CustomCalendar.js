// components/CustomCalendar.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const WEEKDAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export default function CustomCalendar({ appointments = [], onMonthChange, onDaySelect, selectedDate }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Format month and year for displaying
  const monthLabel = MONTHS_FR[month];

  // Notify parent component when the month/year changes so it fetches new appointments
  useEffect(() => {
    if (onMonthChange) {
      onMonthChange(year, month);
    }
  }, [year, month, onMonthChange]);

  // Navigate to previous month
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  // Navigate to next month
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Calculate day cells
  const firstDayOfMonth = new Date(year, month, 1);
  // Get day of week of the 1st of the month: 0=Sunday, 1=Monday... 6=Saturday
  const firstDayOfWeek = firstDayOfMonth.getDay();
  // Adjust so week starts on Monday: 0=Monday ... 6=Sunday
  const startOffset = (firstDayOfWeek + 6) % 7;
  // Get total days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  // Empty slots before 1st of the month
  for (let i = 0; i < startOffset; i++) {
    cells.push({ id: `empty-${i}`, day: null });
  }
  // Days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ id: `day-${d}`, day: d });
  }

  // Map of date string YYYY-MM-DD -> number of appointments
  const appointmentsCount = {};
  appointments.forEach(app => {
    if (app.date) {
      appointmentsCount[app.date] = (appointmentsCount[app.date] || 0) + 1;
    }
  });

  const handleDayPress = (day) => {
    if (!day) return;
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (onDaySelect) {
      onDaySelect(formattedDate);
    }
  };

  const isToday = (day) => {
    if (!day) return false;
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  return (
    <View style={styles.container}>
      {/* Calendar Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.navButton} onPress={handlePrevMonth} activeOpacity={0.7}>
          <Text style={styles.navButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{monthLabel} {year}</Text>
        <TouchableOpacity style={styles.navButton} onPress={handleNextMonth} activeOpacity={0.7}>
          <Text style={styles.navButtonText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Week Days Labels */}
      <View style={styles.weekLabelsRow}>
        {WEEKDAYS_FR.map((label, idx) => (
          <Text key={idx} style={styles.weekLabel}>{label}</Text>
        ))}
      </View>

      {/* Grid of Days */}
      <View style={styles.grid}>
        {cells.map((cell, idx) => {
          const { day, id } = cell;
          const formattedDate = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : null;
          const isSelected = selectedDate === formattedDate;
          const count = formattedDate ? (appointmentsCount[formattedDate] || 0) : 0;
          const today = isToday(day);

          return (
            <TouchableOpacity
              key={id}
              style={[
                styles.cell,
                isSelected && styles.cellSelected,
                today && !isSelected && styles.cellToday
              ]}
              disabled={!day}
              onPress={() => handleDayPress(day)}
              activeOpacity={0.7}
            >
              {day && (
                <>
                  <Text style={[
                    styles.dayText,
                    isSelected && styles.dayTextSelected,
                    today && !isSelected && styles.dayTextToday
                  ]}>
                    {day}
                  </Text>
                  
                  {/* Appointment Count Badge */}
                  {count > 0 && (
                    <View style={[styles.badge, isSelected && styles.badgeSelected]}>
                      <Text style={[styles.badgeText, isSelected && styles.badgeTextSelected]}>
                        {count}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    margin: 16,
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  navButtonText: {
    fontSize: 22,
    color: '#334155',
    lineHeight: 24,
    fontWeight: '300',
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  weekLabelsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekLabel: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginVertical: 2,
    position: 'relative',
  },
  cellSelected: {
    backgroundColor: '#16a34a',
  },
  cellToday: {
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
  },
  dayTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  dayTextToday: {
    color: '#0f172a',
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeSelected: {
    backgroundColor: '#ffffff',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
  },
  badgeTextSelected: {
    color: '#ef4444',
  },
});
