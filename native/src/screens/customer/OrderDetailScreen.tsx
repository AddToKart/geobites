import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../components/common/AppButton';
import { getOrder } from '../../services/orderService';
import { Order } from '../../types';
import { Colors } from '../../utils/colors';
import { formatCurrency } from '../../utils/helpers';
import { CustomerOrdersStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<CustomerOrdersStackParamList, 'OrderDetail'>;

export function OrderDetailScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);

  const loadOrder = async () => {
    const response = await getOrder(orderId);
    setOrder(response);
  };

  useEffect(() => {
    void loadOrder();
  }, [orderId]);

  if (!order) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading order...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Order #{order.id.slice(0, 8)}</Text>
        <Text style={styles.subtitle}>Status: {order.status}</Text>
        <Text style={styles.subtitle}>{order.deliveryAddress}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Items</Text>
        {order.items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemText}>
              {item.quantity}x {item.name}
            </Text>
            <Text style={styles.itemText}>{formatCurrency(item.price * item.quantity)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.total}>Total: {formatCurrency(order.totalAmount)}</Text>
        <AppButton label="Refresh" variant="secondary" onPress={() => void loadOrder()} />
      </View>

      <AppButton label="Back to Orders" variant="secondary" onPress={() => navigation.goBack()} />
    </ScrollView>
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
    padding: 16,
    backgroundColor: Colors.bgPrimary,
    gap: 12,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    backgroundColor: Colors.bgCard,
    padding: 14,
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    color: Colors.textSecondary,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  total: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
});
