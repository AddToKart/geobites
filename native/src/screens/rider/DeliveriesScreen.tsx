import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { AppButton } from '../../components/common/AppButton';
import { getDeliveries } from '../../services/riderService';
import { Order } from '../../types';
import { Colors } from '../../utils/colors';
import { formatCurrency } from '../../utils/helpers';
import { RiderDeliveriesStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RiderDeliveriesStackParamList, 'Deliveries'>;

export function DeliveriesScreen({ navigation }: Props) {
  const [available, setAvailable] = useState<Order[]>([]);
  const [active, setActive] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const [availableOrders, activeOrders] = await Promise.all([
        getDeliveries('available'),
        getDeliveries('active'),
      ]);
      setAvailable(availableOrders);
      setActive(activeOrders);
    } catch (err) {
      console.error('Failed to load rider deliveries:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const totalCount = active.length + available.length;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={[]}
        keyExtractor={() => 'dummy'}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          void loadData(false);
        }}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.wrap}>
            <Text style={styles.largeTitle}>Deliveries</Text>
            <Text style={styles.subtitle}>{totalCount} shipments on board</Text>

            {/* Active Deliveries */}
            <Text style={styles.groupHeader}>Active Jobs</Text>
            {active.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No active deliveries.</Text>
                <Text style={styles.emptySubtext}>Accept a delivery from the available list below.</Text>
              </View>
            ) : null}

            {active.map((order) => {
              const itemCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
              return (
                <Pressable
                  key={order.id}
                  style={[styles.card, styles.activeCard]}
                  onPress={() => navigation.navigate('DeliveryDetail', { orderId: order.id })}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.orderId}>Order #{order.id.slice(0, 8).toUpperCase()}</Text>
                    <View style={styles.activeTag}>
                      <Text style={styles.activeTagText}>{order.status.replace(/_/g, ' ')}</Text>
                    </View>
                  </View>
                  <Text style={styles.address} numberOfLines={2}>📍 {order.deliveryAddress}</Text>
                  
                  <View style={styles.cardFooter}>
                    <Text style={styles.metaText}>{itemCount} item{itemCount !== 1 ? 's' : ''} • {order.paymentMethod || 'COD'}</Text>
                    <Text style={styles.totalText}>{formatCurrency(order.totalAmount)}</Text>
                  </View>
                  <AppButton
                    label="Resume Route"
                    onPress={() => navigation.navigate('DeliveryDetail', { orderId: order.id })}
                    style={styles.openBtn}
                  />
                </Pressable>
              );
            })}

            {/* Available Deliveries */}
            <Text style={styles.groupHeader}>Available Jobs</Text>
            {available.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No available deliveries right now.</Text>
                <Text style={styles.emptySubtext}>Waiting for stores to finish preparing orders...</Text>
              </View>
            ) : null}

            {available.map((order) => {
              const itemCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
              return (
                <Pressable
                  key={order.id}
                  style={styles.card}
                  onPress={() => navigation.navigate('DeliveryDetail', { orderId: order.id })}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.orderId}>Order #{order.id.slice(0, 8).toUpperCase()}</Text>
                    <View style={styles.readyTag}>
                      <Text style={styles.readyTagText}>Ready</Text>
                    </View>
                  </View>
                  <Text style={styles.address} numberOfLines={2}>📍 {order.deliveryAddress}</Text>
                  
                  <View style={styles.cardFooter}>
                    <Text style={styles.metaText}>{itemCount} item{itemCount !== 1 ? 's' : ''} • {order.paymentMethod || 'COD'}</Text>
                    <Text style={styles.totalText}>{formatCurrency(order.totalAmount)}</Text>
                  </View>
                  <AppButton
                    label="View Details & Accept"
                    onPress={() => navigation.navigate('DeliveryDetail', { orderId: order.id })}
                    style={styles.openBtn}
                  />
                </Pressable>
              );
            })}
          </View>
        }
        renderItem={() => null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgPrimary,
  },
  wrap: {
    gap: 12,
  },
  largeTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -1,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  groupHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 4,
    marginTop: 10,
    marginBottom: 4,
  },
  list: {
    padding: 16,
    paddingBottom: 30,
  },
  emptyCard: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  emptySubtext: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    backgroundColor: Colors.bgCard,
    padding: 16,
    gap: 8,
    marginBottom: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  activeCard: {
    borderColor: Colors.primaryLight,
    backgroundColor: Colors.primarySoft,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  activeTag: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  readyTag: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  readyTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  address: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: Colors.borderColor,
    paddingTop: 8,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  totalText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  openBtn: {
    marginTop: 4,
  },
});
