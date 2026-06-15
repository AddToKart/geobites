import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, ActivityIndicator, Alert } from 'react-native';
import { AppButton } from '../../components/common/AppButton';
import { getOrder, updateOrderStatus } from '../../services/orderService';
import { Order, OrderStatus } from '../../types';
import { Colors } from '../../utils/colors';
import { formatCurrency } from '../../utils/helpers';
import { CustomerOrdersStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<CustomerOrdersStackParamList, 'OrderDetail'>;

const timeline: OrderStatus[] = [
  'pending',
  'accepted',
  'preparing',
  'ready_for_pickup',
  'picked_up',
  'delivering',
  'delivered',
];

const statusLabels: Record<string, string> = {
  pending: 'Order Placed',
  accepted: 'Store Approved',
  preparing: 'Preparing in Kitchen',
  ready_for_pickup: 'Ready for Pickup',
  picked_up: 'Picked up by Rider',
  delivering: 'On the Way',
  delivered: 'Delivered',
  rejected: 'Order Declined',
  cancelled: 'Order Cancelled',
};

export function OrderDetailScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const loadOrder = async () => {
    try {
      const response = await getOrder(orderId);
      setOrder(response);
    } catch (err) {
      console.error('Failed to load order:', err);
    }
  };

  useEffect(() => {
    void loadOrder();

    const interval = setInterval(() => {
      void loadOrder();
    }, 10000);

    return () => clearInterval(interval);
  }, [orderId]);

  const handleCancelOrder = async () => {
    if (!order) return;
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(true);
              const updated = await updateOrderStatus(order.id, 'cancelled');
              setOrder(updated);
              Alert.alert('Success', 'Your order was successfully cancelled.');
            } catch (err: any) {
              Alert.alert('Error', err.userMessage || 'Failed to cancel order.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const displayTimeline = useMemo(() => {
    if (!order) return timeline;
    if (order.status === 'cancelled' || order.status === 'rejected') {
      return ['pending', order.status] as any[];
    }
    return timeline;
  }, [order]);

  if (!order) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading tracking...</Text>
      </View>
    );
  }

  const currentStep = displayTimeline.indexOf(order.status);

  return (
    <View style={styles.outerContainer}>
      {/* Ambient background blobs for Glassmorphism */}
      <View style={styles.bgBlob1} />
      <View style={styles.bgBlob2} />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.largeTitle}>Order Track</Text>

        {/* Order Header Card */}
        <View style={styles.groupedContainer}>
          <View style={styles.row}>
            <Text style={styles.orderId}>Order #{order.id.slice(0, 8).toUpperCase()}</Text>
            <View style={[styles.badge, order.status === 'delivered' ? styles.badgeSuccess : styles.badgeInfo]}>
              <Text style={styles.badgeText}>{order.status.replace(/_/g, ' ')}</Text>
            </View>
          </View>
          <Text style={styles.subtext}>Store: {order.vendor?.name || 'Local Merchant'}</Text>
          <Text style={styles.subtext}>Drop-off: {order.deliveryAddress}</Text>
          {order.paymentMethod ? (
            <Text style={styles.paymentMeta}>
              Payment: {order.paymentMethod} • Status: {order.paymentStatus || 'pending'}
            </Text>
          ) : null}
        </View>

        {/* Visual Timeline Tracking Card */}
        <Text style={styles.groupHeader}>Live Status</Text>
        <View style={styles.groupedContainer}>
          <View style={styles.timelineContainer}>
            {displayTimeline.map((step, index) => {
              const isCompleted = index <= currentStep;
              const isCurrent = step === order.status;

              return (
                <View key={step} style={styles.timelineRow}>
                  <View style={styles.timelineGraphic}>
                    <View
                      style={[
                        styles.bullet,
                        isCompleted && styles.bulletActive,
                        isCurrent && styles.bulletCurrent,
                      ]}
                    >
                      {isCurrent ? <View style={styles.bulletInner} /> : null}
                    </View>
                    {index < displayTimeline.length - 1 ? (
                      <View style={[styles.line, isCompleted && styles.lineActive]} />
                    ) : null}
                  </View>
                  <View style={styles.timelineTextCol}>
                    <Text
                      style={[
                        styles.timelineStepLabel,
                        isCompleted && styles.timelineStepLabelActive,
                        isCurrent && styles.timelineStepLabelCurrent,
                      ]}
                    >
                      {statusLabels[step] || step}
                    </Text>
                    <Text style={styles.timelineStepMeta}>
                      {isCurrent ? 'Active step' : isCompleted ? 'Passed' : 'Pending'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Bill Summary */}
        <Text style={styles.groupHeader}>Order Summary</Text>
        <View style={styles.groupedContainer}>
          {order.items.map((item, index) => (
            <View key={item.id}>
              <View style={styles.itemRow}>
                <Text style={styles.itemText}>
                  {item.quantity}x <Text style={styles.itemBold}>{item.name}</Text>
                </Text>
                <Text style={styles.itemPriceText}>{formatCurrency(item.price * item.quantity)}</Text>
              </View>
              {index < order.items.length - 1 ? <View style={styles.separator} /> : null}
            </View>
          ))}
          <View style={styles.separator} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Charge</Text>
            <Text style={styles.totalValue}>{formatCurrency(order.totalAmount)}</Text>
          </View>
        </View>

        {/* Notes */}
        {order.notes ? (
          <View style={styles.groupedContainer}>
            <Text style={styles.notesText}>"Rider Notes: {order.notes}"</Text>
          </View>
        ) : null}

        {order.status === 'pending' ? (
          <View style={styles.cancelWrapper}>
            {cancelling ? (
              <ActivityIndicator color={Colors.danger} />
            ) : (
              <AppButton
                label="Cancel Order"
                variant="secondary"
                onPress={() => void handleCancelOrder()}
                style={styles.cancelBtn}
              />
            )}
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <AppButton label="Done" variant="secondary" onPress={() => navigation.goBack()} />
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
    paddingTop: 96, // Space for transparent navigation header back button
    gap: 12,
    paddingBottom: 30,
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgPrimary,
  },
  loadingText: {
    marginTop: 8,
    color: Colors.textSecondary,
    fontSize: 13,
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderId: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  subtext: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  paymentMeta: {
    color: Colors.primaryDark,
    fontSize: 13,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeInfo: {
    backgroundColor: Colors.primarySoft,
  },
  badgeSuccess: {
    backgroundColor: '#DEF7EC',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
    textTransform: 'uppercase',
  },
  timelineContainer: {
    marginTop: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineGraphic: {
    alignItems: 'center',
    width: 24,
  },
  bullet: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.borderColor,
    backgroundColor: '#FFFFFF',
    zIndex: 2,
  },
  bulletActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  bulletCurrent: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFFFF',
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  line: {
    width: 1.5,
    height: 38,
    backgroundColor: Colors.borderColor,
    position: 'absolute',
    top: 12,
    zIndex: 1,
  },
  lineActive: {
    backgroundColor: Colors.primary,
  },
  timelineTextCol: {
    flex: 1,
    paddingBottom: 20,
    justifyContent: 'center',
  },
  timelineStepLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  timelineStepLabelActive: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  timelineStepLabelCurrent: {
    color: Colors.primaryDark,
    fontWeight: '800',
  },
  timelineStepMeta: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  itemText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  itemBold: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  itemPriceText: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
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
    color: Colors.textPrimary,
    fontWeight: '800',
    fontSize: 15,
  },
  totalValue: {
    color: Colors.primaryDark,
    fontWeight: '800',
    fontSize: 17,
  },
  notesText: {
    color: Colors.textSecondary,
    fontStyle: 'italic',
    fontSize: 13,
  },
  cancelWrapper: {
    marginTop: 10,
    alignItems: 'center',
  },
  cancelBtn: {
    width: '100%',
  },
  footer: {
    padding: 16,
    backgroundColor: Colors.bgCard,
    borderTopWidth: 0.5,
    borderTopColor: Colors.borderColor,
  },
});
