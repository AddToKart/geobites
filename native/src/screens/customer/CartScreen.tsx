import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, ScrollView, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { AppButton } from '../../components/common/AppButton';
import { useCart } from '../../context/CartContext';
import { placeOrder } from '../../services/orderService';
import { Colors } from '../../utils/colors';
import { formatCurrency } from '../../utils/helpers';
import { CustomerBrowseStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<CustomerBrowseStackParamList, 'Cart'>;

type PaymentMethod = 'COD' | 'GCASH' | 'MAYA' | 'QRPH';

export function CartScreen({ navigation }: Props) {
  const { items, vendorId, total, updateQuantity, clearCart } = useCart();
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [error, setError] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [deliveryLat, setDeliveryLat] = useState(14.8214);
  const [deliveryLng, setDeliveryLng] = useState(120.9565);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const checkout = async () => {
    if (!vendorId || items.length === 0) {
      setError('Cart is empty.');
      return;
    }
    if (!deliveryAddress.trim()) {
      setError('Delivery address is required.');
      return;
    }

    try {
      setCheckingOut(true);
      setError(null);
      const order = await placeOrder({
        vendorId,
        deliveryAddress: deliveryAddress.trim(),
        notes: notes.trim() || undefined,
        paymentMethod,
        items: items.map((item) => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
        })),
        deliveryLat,
        deliveryLng,
      });
      clearCart();
      navigation.replace('OrderDetail', { orderId: order.id });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to place order');
    } finally {
      setCheckingOut(false);
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
      {/* Ambient background blobs for Glassmorphic design */}
      <View style={styles.bgBlob1} />
      <View style={styles.bgBlob2} />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.largeTitle}>Review Order</Text>

      {/* Grouped Cart Items Container */}
      <View style={styles.groupedContainer}>
        {items.map((item, index) => (
          <View key={item.menuItem.id} style={styles.rowWrapper}>
            <View style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.menuItem.name}</Text>
                <Text style={styles.itemPrice}>{formatCurrency(item.menuItem.price)}</Text>
              </View>
              <View style={styles.qtyRow}>
                <Pressable
                  style={styles.qtyBtn}
                  onPress={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                >
                  <Text style={styles.qtyBtnText}>-</Text>
                </Pressable>
                <Text style={styles.qtyValue}>{item.quantity}</Text>
                <Pressable
                  style={styles.qtyBtn}
                  onPress={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </Pressable>
              </View>
            </View>
            {index < items.length - 1 ? <View style={styles.separator} /> : null}
          </View>
        ))}
      </View>

      {/* Grouped Delivery details Container */}
      <Text style={styles.groupHeader}>Delivery Details</Text>
      <View style={styles.groupedContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Drop-off Address *</Text>
          <TextInput
            placeholder="Address in Santa Maria, Bulacan"
            placeholderTextColor={Colors.textSecondary}
            value={deliveryAddress}
            onChangeText={setDeliveryAddress}
            style={styles.input}
          />
        </View>
        <View style={styles.separator} />
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Delivery Pin (Drag to change)</Text>
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: deliveryLat,
                longitude: deliveryLng,
                latitudeDelta: 0.015,
                longitudeDelta: 0.0121,
              }}
            >
              <Marker
                draggable
                coordinate={{ latitude: deliveryLat, longitude: deliveryLng }}
                onDragEnd={(e) => {
                  const { latitude, longitude } = e.nativeEvent.coordinate;
                  setDeliveryLat(latitude);
                  setDeliveryLng(longitude);
                }}
                title="Delivery Location"
                description="Drag to set precise drop-off point"
                pinColor={Colors.primary}
              />
            </MapView>
          </View>
        </View>
        <View style={styles.separator} />
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes for Rider</Text>
          <TextInput
            placeholder="Gate code, landmark, instructions..."
            placeholderTextColor={Colors.textSecondary}
            value={notes}
            onChangeText={setNotes}
            style={[styles.input, styles.notesInput]}
            multiline
          />
        </View>
      </View>

      {/* Grouped Payment details Container */}
      <Text style={styles.groupHeader}>Payment Method</Text>
      <View style={styles.groupedContainer}>
        <View style={styles.paymentSelector}>
          {(['COD', 'GCASH', 'MAYA', 'QRPH'] as PaymentMethod[]).map((method) => {
            const isSelected = paymentMethod === method;
            return (
              <Pressable
                key={method}
                style={[styles.paymentBtn, isSelected && styles.paymentBtnSelected]}
                onPress={() => setPaymentMethod(method)}
              >
                <Text style={[styles.paymentBtnText, isSelected && styles.paymentBtnTextSelected]}>
                  {method === 'COD' ? '💵 COD' : method === 'GCASH' ? '🔵 GCash' : method === 'MAYA' ? '🟢 Maya' : '📱 QRPH'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Summary card */}
      <View style={styles.groupedContainer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>Items subtotal</Text>
          <Text style={styles.summaryValue}>{formatCurrency(total)}</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>Quantity count</Text>
          <Text style={styles.summaryValue}>{itemCount}</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total Payout</Text>
          <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.btnWrapper}>
        {checkingOut ? (
          <ActivityIndicator color={Colors.primary} size="large" />
        ) : (
          <AppButton label="Confirm & Place Order" onPress={() => void checkout()} />
        )}
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  scrollContainer: {
    padding: 16,
    paddingTop: 96, // Space for transparent navigation header back button
    gap: 12,
    paddingBottom: 40,
  },
  bgBlob1: {
    position: 'absolute',
    top: 60,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.primary,
    opacity: 0.42,
    zIndex: -1,
  },
  bgBlob2: {
    position: 'absolute',
    bottom: 120,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.accent,
    opacity: 0.38,
    zIndex: -1,
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -1,
    marginTop: 8,
    marginBottom: 4,
  },
  groupHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 12,
    marginTop: 8,
  },
  groupedContainer: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  rowWrapper: {
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: -0.2,
  },
  itemPrice: {
    marginTop: 2,
    color: Colors.textSecondary,
    fontSize: 13,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: Colors.borderColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  qtyValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    minWidth: 16,
    textAlign: 'center',
  },
  separator: {
    height: 0.5,
    backgroundColor: Colors.borderColor,
  },
  inputGroup: {
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  input: {
    fontSize: 15,
    color: Colors.textPrimary,
    paddingVertical: 4,
  },
  notesInput: {
    minHeight: 50,
    textAlignVertical: 'top',
  },
  mapContainer: {
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  paymentSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentBtn: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentBtnSelected: {
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  paymentBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  paymentBtnTextSelected: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  summaryValue: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  totalLabel: {
    color: Colors.textPrimary,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: -0.3,
  },
  totalValue: {
    color: Colors.primaryDark,
    fontWeight: '800',
    fontSize: 18,
  },
  error: {
    color: Colors.danger,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  btnWrapper: {
    marginTop: 10,
    marginBottom: 20,
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
