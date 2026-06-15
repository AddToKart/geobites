import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Switch,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getVendors } from '../../services/vendorService';
import { getVendorMenu, createMenuItem, deleteMenuItem, updateMenuItem } from '../../services/menuService';
import { MenuItem } from '../../types';
import { Colors } from '../../utils/colors';
import { formatCurrency } from '../../utils/helpers';
import { AppButton } from '../../components/common/AppButton';

export function SellerMenuScreen() {
  const { user } = useAuth();
  const [vendor, setVendor] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [savingItem, setSavingItem] = useState(false);

  // Form state for new menu item
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');

  const loadData = async (showLoader = true) => {
    if (!user) return;
    try {
      if (showLoader) setLoading(true);
      const vendorsRes = await getVendors({ page: 1, limit: 100 });
      const myVendor = vendorsRes.data.find((v) => v.userId === user.id);
      setVendor(myVendor || null);

      if (myVendor) {
        const menu = await getVendorMenu(myVendor.id);
        setMenuItems(menu);
      }
    } catch (err: any) {
      console.error('Error loading menu items:', err);
      Alert.alert('Error', 'Failed to load menu items.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [user]);

  const handleToggleAvailable = async (item: MenuItem) => {
    try {
      const nextStatus = !item.isAvailable;
      await updateMenuItem(item.id, { isAvailable: nextStatus });
      setMenuItems((current) =>
        current.map((i) => (i.id === item.id ? { ...i, isAvailable: nextStatus } : i))
      );
    } catch (err: any) {
      Alert.alert('Error', err.userMessage || 'Failed to update item availability.');
    }
  };

  const handleDeleteItem = (item: MenuItem) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to remove "${item.name}" from your menu?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMenuItem(item.id);
              setMenuItems((current) => current.filter((i) => i.id !== item.id));
              Alert.alert('Success', 'Menu item removed.');
            } catch (err: any) {
              Alert.alert('Error', err.userMessage || 'Failed to delete menu item.');
            }
          },
        },
      ]
    );
  };

  const handleAddItem = async () => {
    if (!vendor) return;
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Item name is required.');
      return;
    }
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid price greater than 0.');
      return;
    }

    try {
      setSavingItem(true);
      await createMenuItem({
        vendorId: vendor.id,
        name: name.trim(),
        description: description.trim(),
        category: category.trim() || 'General',
        price: parsedPrice,
        isAvailable: true,
      });

      // Reset form
      setName('');
      setDescription('');
      setCategory('');
      setPrice('');
      setModalVisible(false);
      Alert.alert('Success', 'Menu item added!');
      await loadData(false);
    } catch (err: any) {
      Alert.alert('Error', err.userMessage || 'Failed to add menu item.');
    } finally {
      setSavingItem(false);
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
          You do not have a registered store profile yet. Please set up your shop profile first.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.largeTitle}>Menu Items</Text>
          <Text style={styles.subtitle}>{menuItems.length} items listed on storefront</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Add Item</Text>
        </Pressable>
      </View>

      <FlatList
        data={menuItems}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          void loadData(false);
        }}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No menu items listed yet.</Text>
            <Text style={styles.emptySubtext}>Tap "+ Add Item" to populate your menu.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.itemCard, !item.isAvailable && styles.itemCardDisabled]}>
            <View style={styles.itemMeta}>
              <Text style={styles.itemName}>{item.name}</Text>
              {item.category ? (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
              ) : null}
              {item.description ? (
                <Text style={styles.itemDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
              <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
            </View>
            <View style={styles.itemActions}>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>{item.isAvailable ? 'Available' : 'Sold Out'}</Text>
                <Switch
                  value={item.isAvailable}
                  onValueChange={() => void handleToggleAvailable(item)}
                  trackColor={{ false: '#767577', true: Colors.primaryLight }}
                  thumbColor={item.isAvailable ? Colors.primaryDark : '#f4f3f4'}
                />
              </View>
              <Pressable style={styles.deleteBtn} onPress={() => handleDeleteItem(item)}>
                <Text style={styles.deleteBtnText}>Remove</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      {/* Add Item Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Menu Item</Text>
              <Pressable onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Item Name *</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Special Pork Sisig"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Price (₱) *</Text>
                <TextInput
                  style={styles.input}
                  value={price}
                  onChangeText={setPrice}
                  placeholder="e.g. 180"
                  keyboardType="numeric"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category</Text>
                <TextInput
                  style={styles.input}
                  value={category}
                  onChangeText={setCategory}
                  placeholder="e.g. Sizzling, Drinks, Desserts"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Brief description of ingredients or size..."
                  multiline
                  numberOfLines={3}
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>

              <View style={styles.buttonWrapper}>
                {savingItem ? (
                  <ActivityIndicator color={Colors.primary} size="small" />
                ) : (
                  <AppButton label="Add to Menu" onPress={() => void handleAddItem()} />
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  largeTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  emptySubtext: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  itemCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  itemCardDisabled: {
    opacity: 0.5,
  },
  itemMeta: {
    flex: 1,
    marginRight: 16,
    gap: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    borderColor: Colors.borderColor,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  itemDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginTop: 2,
  },
  itemActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  switchLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  deleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FDE8E8',
  },
  deleteBtnText: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: '700',
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
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  form: {
    gap: 16,
    paddingBottom: 24,
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
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  buttonWrapper: {
    marginTop: 8,
  },
});
