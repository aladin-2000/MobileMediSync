// components/DoctorCard.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function DoctorCard({ doctor, onPress }) {
  const { nom, prenom, specialite, adresseCabinet } = doctor;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <View>
          <Text style={styles.name}>Dr. {prenom} {nom}</Text>
          <Text style={styles.specialty}>{specialite}</Text>
        </View>
      </View>

      <Text style={styles.label}>Cabinet :</Text>
      <Text style={styles.address}>{adresseCabinet}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  specialty: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3b82f6',
    marginTop: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 4,
    marginTop: 8,
  },
  address: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
});
