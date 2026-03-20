import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppButton } from '../../components/common/AppButton';
import { useCart } from '../../context/CartContext';
import { placeOrder } from '../../services/orderService';
import { Colors } from '../../utils/colors';
import { formatCurrency } from '../../utils/helpers';
import { CustomerBrowseStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<CustomerBrowseStackParamList, 'Cart'>;

export function CartScreen({ navigation }: Props) {
  const { items, vendorId, total, updateQuantity, clearCart } = useCart();
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const checkout = async () => {
    if (!vendorId || items.length === 0) {
      setError('Cart is empty.');
      return;
    }

    try {
      const order = await placeOrder({
        vendorId,
        deliveryAddress,
        notes,
        items: items.map((item) => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
        })),
      });
      clearCart();
      navigation.replace('OrderDetail', { orderId: order.id });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to place order');
    }
  };

  if (items.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>Add items from the vendor menu to continue.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.menuItem.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View>
              <Text style={styles.itemName}>{item.menuItem.name}</Text>
              <Text style={styles.itemPrice}>{formatCurrency(item.menuItem.price)}</Text>
            </View>
            <View style={styles.qtyRow}>
              <AppButton
                label="-"
                variant="secondary"
                onPress={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
              />
              <Text style={styles.qtyValue}>{item.quantity}</Text>
              <AppButton
                label="+"
                variant="secondary"
                onPress={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
              />
            </View>
          </View>
        )}
      />

      <View style={styles.checkoutCard}>
        <TextInput
          placeholder="Delivery address"
          placeholderTextColor={Colors.textSecondary}
          value={deliveryAddress}
          onChangeText={setDeliveryAddress}
          style={styles.input}
        />
        <TextInput
          placeholder="Notes"
          placeholderTextColor={Colors.textSecondary}
          value={notes}
          onChangeText={setNotes}
          style={[styles.input, styles.notesInput]}
          multiline
        />

        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>Items: {itemCount}</Text>
          <Text style={styles.summaryTotal}>Total: {formatCurrency(total)}</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <AppButton label="Place Order" onPress={() => void checkout()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
    padding: 16,
    gap: 12,
  },
  list: {
    gap: 10,
    paddingBottom: 12,
  },
  itemCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  itemPrice: {
    marginTop: 2,
    color: Colors.textSecondary,
    fontSize: 13,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyValue: {
    minWidth: 22,
    textAlign: 'center',
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  checkoutCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    backgroundColor: Colors.bgCard,
    padding: 12,
    gap: 10,
  },
  input: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    paddingHorizontal: 12,
    backgroundColor: Colors.bgCard,
    color: Colors.textPrimary,
  },
  notesInput: {
    minHeight: 70,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryText: {
    color: Colors.textSecondary,
  },
  summaryTotal: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  error: {
    color: Colors.danger,
    fontSize: 13,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgPrimary,
    padding: 20,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  emptySubtitle: {
    marginTop: 6,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
