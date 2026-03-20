import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { OrderCard } from '../../components/ui/OrderCard';
import { getOrders } from '../../services/orderService';
import { Order } from '../../types';
import { Colors } from '../../utils/colors';
import { CustomerOrdersStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<CustomerOrdersStackParamList, 'Orders'>;

export function OrdersScreen({ navigation }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    void (async () => {
      const response = await getOrders({ page: 1, limit: 20 });
      setOrders(response.data);
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Orders</Text>
      <FlatList
        contentContainerStyle={styles.list}
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
          />
        )}
      />
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  list: {
    gap: 10,
    paddingBottom: 20,
  },
});
