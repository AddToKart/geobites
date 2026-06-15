import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Vendor } from '../../types';
import { Colors } from '../../utils/colors';

export function VendorCard({
  vendor,
  onPress,
  distanceKm,
}: {
  vendor: Vendor;
  onPress: () => void;
  distanceKm?: number;
}) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <Text style={styles.title}>{vendor.name}</Text>
      </View>
      <Text style={styles.address}>{vendor.address}</Text>
      {vendor.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {vendor.description}
        </Text>
      ) : null}
      <View style={styles.footerRow}>
        {distanceKm !== undefined ? (
          <Text style={styles.distanceText}>📍 {distanceKm.toFixed(2)} km away</Text>
        ) : null}
        <View style={styles.ratingRow}>
          <Text style={styles.starText}>⭐</Text>
          <Text style={styles.ratingValue}>{vendor.rating.toFixed(1)}</Text>
          <Text style={styles.ratingCount}>({vendor.totalRatings || 0})</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    gap: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  address: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.08)',
    paddingTop: 10,
  },
  distanceText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  starText: {
    fontSize: 12,
  },
  ratingValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  ratingCount: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
