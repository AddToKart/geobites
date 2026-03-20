import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../components/common/AppButton';
import { getOrder } from '../../services/orderService';
import { acceptDelivery, updateDeliveryStatus } from '../../services/riderService';
import { Order } from '../../types';
import { Colors } from '../../utils/colors';
import { RiderDeliveriesStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RiderDeliveriesStackParamList, 'DeliveryDetail'>;

const transitions: Record<string, Array<'picked_up' | 'delivering' | 'delivered'>> = {
  ready_for_pickup: ['picked_up'],
  picked_up: ['delivering'],
  delivering: ['delivered'],
};

export function DeliveryDetailScreen({ route }: Props) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = async () => {
    try {
      const response = await getOrder(orderId);
      setOrder(response);
      setError(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to load delivery');
    }
  };

  useEffect(() => {
    void loadOrder();
  }, [orderId]);

  const accept = async () => {
    try {
      const response = await acceptDelivery(orderId);
      setOrder(response);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to accept delivery');
    }
  };

  const updateStatus = async (status: 'picked_up' | 'delivering' | 'delivered') => {
    try {
      const response = await updateDeliveryStatus(orderId, status);
      setOrder(response);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Failed to update status');
    }
  };

  if (!order) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>{error ?? 'Loading delivery...'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Delivery #{order.id.slice(0, 8)}</Text>
      <View style={styles.card}>
        <Text style={styles.meta}>Status: {order.status}</Text>
        <Text style={styles.meta}>{order.deliveryAddress}</Text>
      </View>

      {!order.rider && order.status === 'ready_for_pickup' ? (
        <AppButton label="Accept Delivery" onPress={() => void accept()} />
      ) : null}

      <View style={styles.actions}>
        {(transitions[order.status] ?? []).map((status) => (
          <AppButton key={status} label={status} onPress={() => void updateStatus(status)} />
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <AppButton label="Refresh" variant="secondary" onPress={() => void loadOrder()} />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgPrimary,
  },
  loadingText: {
    color: Colors.textSecondary,
  },
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
    backgroundColor: Colors.bgPrimary,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    backgroundColor: Colors.bgCard,
    padding: 12,
    gap: 4,
  },
  meta: {
    color: Colors.textSecondary,
  },
  actions: {
    gap: 8,
  },
  error: {
    color: Colors.danger,
    fontSize: 13,
  },
});
