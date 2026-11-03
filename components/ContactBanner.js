import { View, Text, StyleSheet } from 'react-native';

export default function ContactBanner() {
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>
        Pour plus d'info contactez-nous
      </Text>
      <Text style={styles.details}>
        Email : noreply@medisync.tn  |  Tél : 22 460 401
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#059669',
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  text: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  details: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
});
