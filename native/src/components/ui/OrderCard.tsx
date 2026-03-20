import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Order } from '../../types';
import { Colors } from '../../utils/colors';
import { formatCurrency } from '../../utils/helpers';

export function OrderCard({
  order,
  onPress,
}: {
  order: Order;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <Text style={styles.id}>Order #{order.id.slice(0, 8)}</Text>
        <Text style={styles.status}>{order.status}</Text>
      </View>
      <Text style={styles.address}>{order.deliveryAddress}</Text>
      <Text style={styles.total}>{formatCurrency(order.totalAmount)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  id: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  status: {
    fontSize: 12,
    color: Colors.primaryDark,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  address: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  total: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
});
