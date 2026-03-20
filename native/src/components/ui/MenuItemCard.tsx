import { StyleSheet, Text, View } from 'react-native';
import { MenuItem } from '../../types';
import { Colors } from '../../utils/colors';
import { formatCurrency } from '../../utils/helpers';
import { AppButton } from '../common/AppButton';

export function MenuItemCard({
  menuItem,
  quantity,
  onAdd,
  onRemove,
}: {
  menuItem: MenuItem;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.title}>{menuItem.name}</Text>
        <Text style={styles.price}>{formatCurrency(menuItem.price)}</Text>
      </View>
      {menuItem.description ? <Text style={styles.description}>{menuItem.description}</Text> : null}
      <View style={styles.actions}>
        <AppButton label="-" variant="secondary" onPress={onRemove} disabled={quantity === 0} />
        <Text style={styles.quantity}>{quantity}</Text>
        <AppButton label="+" onPress={onAdd} disabled={!menuItem.isAvailable} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'flex-end',
  },
  quantity: {
    minWidth: 22,
    textAlign: 'center',
    color: Colors.textPrimary,
    fontWeight: '600',
  },
});
