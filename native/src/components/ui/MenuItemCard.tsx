import { StyleSheet, Text, View, Pressable } from 'react-native';
import { MenuItem } from '../../types';
import { Colors } from '../../utils/colors';
import { formatCurrency } from '../../utils/helpers';

export function MenuItemCard({
  menuItem,
  quantity,
  onAdd,
  onRemove,
  disabled,
}: {
  menuItem: MenuItem;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const isAvailable = menuItem.isAvailable && !disabled;

  return (
    <View style={[styles.card, !isAvailable && styles.cardDisabled]}>
      <View style={styles.content}>
        <Text style={styles.title}>{menuItem.name}</Text>
        {menuItem.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {menuItem.description}
          </Text>
        ) : null}
        <Text style={styles.price}>{formatCurrency(menuItem.price)}</Text>
      </View>
      <View style={styles.actions}>
        {quantity > 0 ? (
          <View style={styles.qtyContainer}>
            <Pressable
              style={styles.qtyBtn}
              onPress={onRemove}
              disabled={disabled}
            >
              <Text style={styles.qtyBtnText}>-</Text>
            </Pressable>
            <Text style={styles.quantity}>{quantity}</Text>
            <Pressable
              style={styles.qtyBtn}
              onPress={onAdd}
              disabled={!isAvailable}
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={[styles.addBtn, !isAvailable && styles.addBtnDisabled]}
            onPress={onAdd}
            disabled={!isAvailable}
          >
            <Text style={styles.addBtnText}>ADD</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  cardDisabled: {
    opacity: 0.6,
  },
  content: {
    flex: 1,
    marginRight: 16,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginTop: 2,
  },
  description: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  actions: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primarySoft,
    borderRadius: 12,
    padding: 2,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  quantity: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
    minWidth: 16,
    textAlign: 'center',
  },
  addBtn: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primaryLight,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addBtnDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderColor: Colors.borderColor,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
});
