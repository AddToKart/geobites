import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../components/common/AppButton';
import { getDeliveries } from '../../services/riderService';
import { Order } from '../../types';
import { Colors } from '../../utils/colors';
import { RiderDeliveriesStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RiderDeliveriesStackParamList, 'Deliveries'>;

export function DeliveriesScreen({ navigation }: Props) {
  const [available, setAvailable] = useState<Order[]>([]);
  const [active, setActive] = useState<Order[]>([]);

  const loadData = async () => {
    const [availableOrders, activeOrders] = await Promise.all([
      getDeliveries('available'),
      getDeliveries('active'),
    ]);
    setAvailable(availableOrders);
    setActive(activeOrders);
  };

  useEffect(() => {
    void loadData();
  }, []);

  return (
    <FlatList
      contentContainerStyle={styles.container}
      data={[...active, ...available]}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View style={styles.headerWrap}>
          <Text style={styles.title}>Deliveries</Text>
          <Text style={styles.section}>Active</Text>
          {active.length === 0 ? <Text style={styles.empty}>No active deliveries</Text> : null}
          {active.map((order) => (
            <View key={order.id} style={styles.card}>
              <Text style={styles.orderId}>Order #{order.id.slice(0, 8)}</Text>
              <Text style={styles.meta}>{order.deliveryAddress}</Text>
              <Text style={styles.meta}>Status: {order.status}</Text>
              <AppButton
                label="Open"
                variant="secondary"
                onPress={() =>
                  navigation.navigate('DeliveryDetail', {
                    orderId: order.id,
                  })
                }
              />
            </View>
          ))}

          <Text style={styles.section}>Available</Text>
          {available.length === 0 ? <Text style={styles.empty}>No available deliveries</Text> : null}
          {available.map((order) => (
            <View key={order.id} style={styles.card}>
              <Text style={styles.orderId}>Order #{order.id.slice(0, 8)}</Text>
              <Text style={styles.meta}>{order.deliveryAddress}</Text>
              <Text style={styles.meta}>Ready for pickup</Text>
              <AppButton
                label="Open"
                onPress={() =>
                  navigation.navigate('DeliveryDetail', {
                    orderId: order.id,
                  })
                }
              />
            </View>
          ))}
        </View>
      }
      renderItem={() => null}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: Colors.bgPrimary,
  },
  headerWrap: {
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  section: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    backgroundColor: Colors.bgCard,
    padding: 12,
    gap: 6,
  },
  orderId: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  meta: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  empty: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
});
