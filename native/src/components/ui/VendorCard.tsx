import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Vendor } from '../../types';
import { Colors } from '../../utils/colors';

export function VendorCard({
  vendor,
  onPress,
}: {
  vendor: Vendor;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <Text style={styles.title}>{vendor.name}</Text>
        <Text style={styles.rating}>{vendor.rating.toFixed(1)}</Text>
      </View>
      <Text style={styles.address}>{vendor.address}</Text>
      <Text style={styles.description} numberOfLines={2}>
        {vendor.description || 'No description yet'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    padding: 14,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  rating: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  address: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
