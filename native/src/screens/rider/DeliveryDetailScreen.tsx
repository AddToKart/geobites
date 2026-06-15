import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { AppButton } from '../../components/common/AppButton';
import { getOrder } from '../../services/orderService';
import { acceptDelivery, updateDeliveryStatus } from '../../services/riderService';
import { Order } from '../../types';
import { Colors } from '../../utils/colors';
import { formatCurrency } from '../../utils/helpers';
import { RiderDeliveriesStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RiderDeliveriesStackParamList, 'DeliveryDetail'>;

const transitions: Record<string, Array<'picked_up' | 'delivering' | 'delivered'>> = {
  ready_for_pickup: ['picked_up'],
  picked_up: ['delivering'],
  delivering: ['delivered'],
};

const actionLabels: Record<string, string> = {
  picked_up: 'Confirm Cargo Pickup',
  delivering: 'Start Trip 🚴',
  delivered: 'Mark as Delivered ✅',
};

export function DeliveryDetailScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const response = await getOrder(orderId);
      setOrder(response);
      setError(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to load delivery');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrder();
  }, [orderId]);

  const handleAccept = async () => {
    try {
      setActionLoading(true);
      const response = await acceptDelivery(orderId);
      setOrder(response);
      Alert.alert('Success', 'Delivery job accepted! Navigate to the store for pickup.');
    } catch (caughtError) {
      Alert.alert('Error', caughtError instanceof Error ? caughtError.message : 'Failed to accept job.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (status: 'picked_up' | 'delivering' | 'delivered') => {
    try {
      setActionLoading(true);
      const response = await updateDeliveryStatus(orderId, status);
      setOrder(response);
      if (status === 'delivered') {
        Alert.alert('Success', 'Job completed! Great work.');
        navigation.goBack();
      } else {
        Alert.alert('Success', `Status updated to: ${status.replace(/_/g, ' ')}`);
      }
    } catch (caughtError) {
      Alert.alert('Error', caughtError instanceof Error ? caughtError.message : 'Failed to update delivery status.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Order not found.'}</Text>
        <AppButton label="Retry" onPress={() => void loadOrder()} style={{ marginTop: 12 }} />
      </View>
    );
  }

  return (
    <View style={styles.outerContainer}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.largeTitle}>Job Details</Text>

        {/* Header Card */}
        <View style={styles.groupedContainer}>
          <View style={styles.row}>
            <Text style={styles.orderId}>Delivery #{order.id.slice(0, 8).toUpperCase()}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>{order.status.replace(/_/g, ' ')}</Text>
            </View>
          </View>
          <Text style={styles.subtext}>Drop-off Address: {order.deliveryAddress}</Text>
          <Text style={styles.subtext}>Payment: {order.paymentMethod || 'COD'} ({order.paymentStatus || 'pending'})</Text>
        </View>

        {/* Store Card */}
        <Text style={styles.groupHeader}>Merchant</Text>
        <View style={styles.groupedContainer}>
          <Text style={styles.storeName}>{order.vendor?.name || 'Local Merchant'}</Text>
          <Text style={styles.storeAddress}>📍 {order.vendor?.address || 'Bulacan Address'}</Text>
        </View>

        {/* Items list card */}
        <Text style={styles.groupHeader}>Order Content</Text>
        <View style={styles.groupedContainer}>
          {order.items?.map((item, index) => (
            <View key={item.id}>
              <View style={styles.itemRow}>
                <Text style={styles.itemText}>
                  {item.quantity}x <Text style={styles.itemNameText}>{item.name}</Text>
                </Text>
                <Text style={styles.itemPriceText}>{formatCurrency(item.price * item.quantity)}</Text>
              </View>
              {index < order.items.length - 1 ? <View style={styles.separator} /> : null}
            </View>
          ))}
          <View style={styles.separator} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Collect from Client</Text>
            <Text style={styles.totalValue}>{formatCurrency(order.totalAmount)}</Text>
          </View>
        </View>

        {/* Notes */}
        {order.notes ? (
          <View style={styles.groupedContainer}>
            <Text style={styles.notesText}>"Rider Instructions: {order.notes}"</Text>
          </View>
        ) : null}

        {/* Action Controls */}
        <View style={styles.actionWrap}>
          {actionLoading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <>
              {!order.riderId && order.status === 'ready_for_pickup' ? (
                <AppButton label="Accept Delivery Job" onPress={() => void handleAccept()} />
              ) : null}

              {order.riderId ? (
                <View style={styles.buttonList}>
                  {(transitions[order.status] ?? []).map((status) => (
                    <AppButton
                      key={status}
                      label={actionLabels[status] || status}
                      onPress={() => void handleUpdateStatus(status)}
                    />
                  ))}
                </View>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <AppButton label="Back" variant="secondary" onPress={() => navigation.goBack()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  container: {
    padding: 16,
    gap: 12,
    paddingBottom: 30,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgPrimary,
  },
  largeTitle: {
    fontSize: 32,
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
    marginTop: 6,
  },
  groupedContainer: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  statusBadge: {
    backgroundColor: Colors.primarySoft,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
    textTransform: 'uppercase',
  },
  subtext: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  storeAddress: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  itemText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  itemNameText: {
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  itemPriceText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  separator: {
    height: 0.5,
    backgroundColor: Colors.borderColor,
    marginVertical: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  notesText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  actionWrap: {
    marginTop: 10,
  },
  buttonList: {
    gap: 8,
  },
  errorText: {
    color: Colors.danger,
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    backgroundColor: Colors.bgCard,
    borderTopWidth: 0.5,
    borderTopColor: Colors.borderColor,
  },
});
