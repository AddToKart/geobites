import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import {
  SectionList,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Pressable,
  ScrollView,
} from 'react-native';
import { AppButton } from '../../components/common/AppButton';
import { AppInput } from '../../components/common/AppInput';
import { MenuItemCard } from '../../components/ui/MenuItemCard';
import { useCart } from '../../context/CartContext';
import { getVendorMenu } from '../../services/menuService';
import { getVendorById } from '../../services/vendorService';
import { MenuItem, Vendor } from '../../types';
import { Colors } from '../../utils/colors';
import { CustomerBrowseStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<CustomerBrowseStackParamList, 'VendorDetail'>;

export function VendorDetailScreen({ route, navigation }: Props) {
  const { vendorId, vendorName } = route.params;
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const { items, addItem, updateQuantity } = useCart();

  const loadData = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const [vendorData, menuData] = await Promise.all([
        getVendorById(vendorId),
        getVendorMenu(vendorId),
      ]);
      setVendor(vendorData);
      setMenuItems(menuData);
    } catch (err) {
      console.error('Failed to load vendor storefront:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [vendorId]);

  const quantityMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      map.set(item.menuItem.id, item.quantity);
    }
    return map;
  }, [items]);

  // Categories list
  const categories = useMemo(() => {
    const list = new Set<string>();
    for (const item of menuItems) {
      list.add(item.category || 'General');
    }
    return ['All', ...Array.from(list)];
  }, [menuItems]);

  // Grouped and filtered menu sections
  const sections = useMemo(() => {
    const filtered = menuItems.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        activeCategory === 'All' || (item.category || 'General') === activeCategory;

      return matchesSearch && matchesCategory;
    });

    const groups: Record<string, MenuItem[]> = {};
    for (const item of filtered) {
      const cat = item.category || 'General';
      groups[cat] = groups[cat] || [];
      groups[cat].push(item);
    }

    return Object.keys(groups).map((title) => ({
      title,
      data: groups[title],
    }));
  }, [menuItems, search, activeCategory]);

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={styles.loadingText}>Opening storefront...</Text>
      </View>
    );
  }

  const isOffline = vendor ? !vendor.isActive : false;

  return (
    <View style={styles.container}>
      {/* Ambient background blobs for Glassmorphic design */}
      <View style={styles.bgBlob1} />
      <View style={styles.bgBlob2} />

      {/* Offline banner */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>⚠️ Closed • Offline right now</Text>
        </View>
      )}

      {/* Main List */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          void loadData(false);
        }}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>{vendorName}</Text>
            {vendor ? (
              <View style={styles.metaRow}>
                <Text style={styles.ratingText}>⭐ {vendor.rating.toFixed(1)} ({vendor.totalRatings})</Text>
                <Text style={styles.addressText} numberOfLines={1}>{vendor.address}</Text>
              </View>
            ) : null}
            {vendor?.description ? (
              <Text style={styles.descText}>{vendor.description}</Text>
            ) : null}

            {/* Menu Search */}
            <AppInput
              value={search}
              onChangeText={setSearch}
              placeholder="🔍 Search in menu"
              style={styles.searchInput}
            />

            {/* Category chips scroll */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsScroll}
            >
              {categories.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <Pressable
                    key={cat}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => setActiveCategory(cat)}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        }
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.itemWrapper}>
            <MenuItemCard
              menuItem={item}
              quantity={quantityMap.get(item.id) ?? 0}
              onAdd={() => addItem(item)}
              onRemove={() => updateQuantity(item.id, (quantityMap.get(item.id) ?? 0) - 1)}
              disabled={isOffline}
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No menu items found.</Text>
          </View>
        }
      />

      {cartCount > 0 ? (
        <View style={styles.footer}>
          <AppButton
            label={`View Cart (${cartCount})`}
            onPress={() => navigation.navigate('Cart')}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  bgBlob1: {
    position: 'absolute',
    top: 50,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: Colors.primary,
    opacity: 0.42,
    zIndex: -1,
  },
  bgBlob2: {
    position: 'absolute',
    bottom: 150,
    left: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.accent,
    opacity: 0.38,
    zIndex: -1,
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
  offlineBanner: {
    backgroundColor: '#FDE8E8',
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#EF4444',
  },
  offlineText: {
    color: Colors.danger,
    fontWeight: '700',
    fontSize: 13,
  },
  listContainer: {
    paddingBottom: 40,
  },
  header: {
    padding: 16,
    paddingTop: 96, // Account for transparent navigation stack header
    gap: 8,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.borderColor,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  descText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: 2,
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 12,
    fontSize: 15,
    marginTop: 8,
  },
  chipsScroll: {
    gap: 8,
    paddingVertical: 8,
  },
  chip: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.bgPrimary,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  itemWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  footer: {
    padding: 16,
    backgroundColor: Colors.bgCard,
    borderTopWidth: 0.5,
    borderTopColor: Colors.borderColor,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
});
