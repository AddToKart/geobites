import React, { useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Pressable,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getOrders, updateOrderStatus } from '../../services/orderService';
import { getVendors } from '../../services/vendorService';
import { Order, OrderStatus } from '../../types';
import { Colors } from '../../utils/colors';
import { formatCurrency } from '../../utils/helpers';
import { AppButton } from '../../components/common/AppButton';

type ActiveTab = 'pending' | 'kitchen' | 'completed';

export function SellerDashboardScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('pending');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const vendorsRes = await getVendors({ page: 1, limit: 100 });
      const myVendor = vendorsRes.data.find((v) => v.userId === user.id);
      setVendor(myVendor || null);

      if (myVendor) {
        const ordersRes = await getOrders({ page: 1, limit: 100 });
        const myOrders = ordersRes.data.filter((o) => o.vendorId === myVendor.id);
        setOrders(myOrders);
      }
    } catch (err: any) {
      console.error('Error loading seller dashboard data:', err);
      Alert.alert('Error', err.userMessage || 'Failed to load seller dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [user]);

  const handleStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      setActionLoading(true);
      await updateOrderStatus(orderId, nextStatus);
      setModalVisible(false);
      setSelectedOrder(null);
      Alert.alert('Success', `Order status updated to ${nextStatus.replace(/_/g, ' ')}`);
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err.userMessage || 'Failed to update order status');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter orders based on tabs
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const kitchenOrders = orders.filter((o) =>
    ['accepted', 'preparing', 'ready_for_pickup'].includes(o.status)
  );
  const completedOrders = orders.filter((o) =>
    ['picked_up', 'delivering', 'delivered', 'rejected', 'cancelled'].includes(o.status)
  );

  const getActiveOrders = () => {
    switch (activeTab) {
      case 'pending':
        return pendingOrders;
      case 'kitchen':
        return kitchenOrders;
      case 'completed':
        return completedOrders;
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return Colors.warning;
      case 'accepted':
      case 'preparing':
        return Colors.primary;
      case 'ready_for_pickup':
      case 'picked_up':
      case 'delivering':
        return Colors.accent;
      case 'delivered':
        return Colors.success;
      default:
        return Colors.danger;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }

  if (!vendor) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>No Store Registered</Text>
        <Text style={styles.errorText}>
          You do not have a registered store profile yet. Please set up your shop settings.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Store Header */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.largeTitle}>{vendor.name}</Text>
          <Text style={styles.shopMeta} numberOfLines={1}>{vendor.address}</Text>
        </View>
        <View style={[styles.statusIndicator, vendor.isActive ? styles.statusActive : styles.statusOffline]}>
          <Text style={[styles.statusLabel, { color: vendor.isActive ? '#046A38' : '#8A1F1F' }]}>
            {vendor.isActive ? 'Active' : 'Offline'}
          </Text>
        </View>
      </View>

      {/* iOS Segmented Control Tab Bar */}
      <View style={styles.segmentedContainer}>
        <View style={styles.segmentedControl}>
          {(['pending', 'kitchen', 'completed'] as ActiveTab[]).map((tab) => {
            const isActive = activeTab === tab;
            let count = 0;
            let label = '';
            if (tab === 'pending') {
              count = pendingOrders.length;
              label = 'Pending';
            } else if (tab === 'kitchen') {
              count = kitchenOrders.length;
              label = 'Kitchen';
            } else {
              count = completedOrders.length;
              label = 'History';
            }

            return (
              <Pressable
                key={tab}
                style={[styles.segmentBtn, isActive && styles.segmentBtnActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                  {label} ({count})
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Order List */}
      <FlatList
        data={getActiveOrders()}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={loadData}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No orders in this lane.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.orderCard}
            onPress={() => {
              setSelectedOrder(item);
              setModalVisible(true);
            }}
          >
            <View style={styles.orderCardHeader}>
              <Text style={styles.orderCardId}>Order #{item.id.slice(0, 8).toUpperCase()}</Text>
              <View style={[styles.statusTag, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                <Text style={[styles.orderCardStatus, { color: getStatusColor(item.status) }]}>
                  {item.status.replace(/_/g, ' ')}
                </Text>
              </View>
            </View>

            <Text style={styles.orderCardAddress} numberOfLines={1}>
              📍 {item.deliveryAddress}
            </Text>

            <View style={styles.orderCardFooter}>
              <Text style={styles.orderCardItemsCount}>
                {item.items.reduce((acc, current) => acc + current.quantity, 0)} items
              </Text>
              <Text style={styles.orderCardTotal}>{formatCurrency(item.totalAmount)}</Text>
            </View>
          </Pressable>
        )}
      />

      {/* Order Details Modal */}
      {selectedOrder && (
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Order Details</Text>
                <Pressable onPress={() => setModalVisible(false)} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </Pressable>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.detailsSection}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Order ID</Text>
                    <Text style={styles.detailValue}>
                      #{selectedOrder.id.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <Text
                      style={[
                        styles.detailValue,
                        { color: getStatusColor(selectedOrder.status), fontWeight: '800' },
                      ]}
                    >
                      {selectedOrder.status.replace(/_/g, ' ').toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Address</Text>
                    <Text style={styles.detailValue}>{selectedOrder.deliveryAddress}</Text>
                  </View>
                  {selectedOrder.notes ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Rider Note</Text>
                      <Text style={styles.detailValueItalic}>"{selectedOrder.notes}"</Text>
                    </View>
                  ) : null}
                </View>

                {/* Items List */}
                <Text style={styles.sectionTitle}>Items</Text>
                <View style={styles.itemsContainer}>
                  {selectedOrder.items.map((item, index) => (
                    <View key={item.id}>
                      <View style={styles.itemRow}>
                        <Text style={styles.itemName}>
                          {item.quantity}x <Text style={{ fontWeight: '600' }}>{item.name}</Text>
                        </Text>
                        <Text style={styles.itemPrice}>
                          {formatCurrency(item.price * item.quantity)}
                        </Text>
                      </View>
                      {index < selectedOrder.items.length - 1 ? <View style={styles.separator} /> : null}
                    </View>
                  ))}
                  <View style={styles.separator} />
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Grand Total</Text>
                    <Text style={styles.totalValue}>
                      {formatCurrency(selectedOrder.totalAmount)}
                    </Text>
                  </View>
                </View>
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                {actionLoading ? (
                  <ActivityIndicator color={Colors.primary} size="small" />
                ) : (
                  <>
                    {selectedOrder.status === 'pending' && (
                      <View style={styles.actionRow}>
                        <Pressable
                          style={[styles.actionBtn, styles.rejectBtn]}
                          onPress={() => handleStatusChange(selectedOrder.id, 'rejected')}
                        >
                          <Text style={styles.rejectBtnText}>Decline</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.actionBtn, styles.acceptBtn]}
                          onPress={() => handleStatusChange(selectedOrder.id, 'accepted')}
                        >
                          <Text style={styles.acceptBtnText}>Accept</Text>
                        </Pressable>
                      </View>
                    )}

                    {selectedOrder.status === 'accepted' && (
                      <AppButton
                        label="Start Cooking 🍳"
                        onPress={() => handleStatusChange(selectedOrder.id, 'preparing')}
                      />
                    )}

                    {selectedOrder.status === 'preparing' && (
                      <AppButton
                        label="Mark Ready for Pickup 📦"
                        onPress={() => handleStatusChange(selectedOrder.id, 'ready_for_pickup')}
                      />
                    )}

                    {selectedOrder.status === 'ready_for_pickup' && (
                      <Text style={styles.waitingRiderText}>
                        Waiting for rider to pick up shipment...
                      </Text>
                    )}
                  </>
                )}
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgPrimary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.bgPrimary,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.borderColor,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  largeTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  shopMeta: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusActive: {
    backgroundColor: '#DEF7EC',
  },
  statusOffline: {
    backgroundColor: '#FDE8E8',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  segmentedContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.borderColor,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 8,
    padding: 2,
    height: 36,
  },
  segmentBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  orderCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    padding: 16,
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderCardId: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  orderCardStatus: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  orderCardAddress: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: Colors.borderColor,
  },
  orderCardItemsCount: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  orderCardTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  closeButton: {
    padding: 6,
  },
  closeButtonText: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  modalBody: {
    marginBottom: 20,
  },
  detailsSection: {
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'column',
    gap: 2,
  },
  detailLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    color: Colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  detailValueItalic: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 4,
    marginBottom: 8,
  },
  itemsContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  separator: {
    height: 0.5,
    backgroundColor: Colors.borderColor,
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
  modalActions: {
    paddingBottom: 24,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    backgroundColor: '#FDE8E8',
  },
  rejectBtnText: {
    color: Colors.danger,
    fontWeight: '700',
    fontSize: 15,
  },
  acceptBtn: {
    backgroundColor: Colors.primary,
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  waitingRiderText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
});
