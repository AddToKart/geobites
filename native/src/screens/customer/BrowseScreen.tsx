import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { AppInput } from '../../components/common/AppInput';
import { VendorCard } from '../../components/ui/VendorCard';
import { getVendors } from '../../services/vendorService';
import { getOrders } from '../../services/orderService';
import { Vendor, Order } from '../../types';
import { Colors } from '../../utils/colors';
import { CustomerBrowseStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<CustomerBrowseStackParamList, 'Browse'>;

type SortType = 'distance' | 'rating' | 'name';

const SANTA_MARIA_CENTER = { lat: 14.8214, lng: 120.9565 };

function getVendorDistanceKm(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function BrowseScreen({ navigation }: Props) {
  const [search, setSearch] = useState('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [sortBy, setSortBy] = useState<SortType>('distance');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const [vendorsRes, ordersRes] = await Promise.all([
        getVendors({ page: 1, limit: 100 }),
        getOrders({ page: 1, limit: 20 }),
      ]);

      setVendors(vendorsRes.data.filter((vendor) => vendor.isActive));
      
      const trackedOrder = ordersRes.data.find((order) =>
        ['pending', 'accepted', 'preparing', 'ready_for_pickup', 'picked_up', 'delivering'].includes(
          order.status
        )
      ) ?? null;
      setActiveOrder(trackedOrder);
    } catch (err) {
      console.error('Failed to load browse page data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const processedVendors = useMemo(() => {
    const withDistance = vendors.map((vendor) => {
      const distance = getVendorDistanceKm(SANTA_MARIA_CENTER, {
        lat: Number(vendor.latitude) || SANTA_MARIA_CENTER.lat,
        lng: Number(vendor.longitude) || SANTA_MARIA_CENTER.lng,
      });
      return { ...vendor, distance };
    });

    const filtered = withDistance.filter((vendor) => {
      if (!search.trim()) return true;
      const term = search.toLowerCase();
      return (
        vendor.name.toLowerCase().includes(term) ||
        (vendor.description || '').toLowerCase().includes(term) ||
        vendor.address.toLowerCase().includes(term)
      );
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'rating') {
        return b.rating - a.rating;
      }
      return a.distance - b.distance;
    });
  }, [vendors, search, sortBy]);

  return (
    <View style={styles.container}>
      {/* Ambient background blobs for Glassmorphism */}
      <View style={styles.bgBlob1} />
      <View style={styles.bgBlob2} />

      <Text style={styles.largeTitle}>Explore Food</Text>
      
      {/* iOS styled Search Bar */}
      <View style={styles.searchContainer}>
        <AppInput
          value={search}
          onChangeText={setSearch}
          placeholder="🔍 Search dishes, shops, or street"
          style={styles.searchInput}
        />
      </View>

      {/* Active Order Banner */}
      {activeOrder ? (
        <Pressable
          style={styles.activeOrderBanner}
          onPress={() => navigation.navigate('OrderDetail', { orderId: activeOrder.id })}
        >
          <View style={styles.bannerTextCol}>
            <Text style={styles.bannerTitle}>🚴 Active Order In Progress</Text>
            <Text style={styles.bannerSubtitle}>
              Status: {statusLabels[activeOrder.status] || activeOrder.status.replace(/_/g, ' ')}
            </Text>
          </View>
          <Text style={styles.bannerArrow}>→</Text>
        </Pressable>
      ) : null}

      {/* iOS Segmented Control */}
      <View style={styles.segmentedControlContainer}>
        {(['distance', 'rating', 'name'] as SortType[]).map((type) => {
          const isActive = sortBy === type;
          return (
            <Pressable
              key={type}
              style={[styles.segmentBtn, isActive && styles.segmentBtnActive]}
              onPress={() => setSortBy(type)}
            >
              <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                {type === 'distance' ? 'Near Me' : type === 'rating' ? 'Top Rated' : 'A-Z'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText}>Searching nearby...</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={processedVendors}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void loadData(false);
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No matching shops found.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <VendorCard
              vendor={item}
              distanceKm={(item as any).distance}
              onPress={() =>
                navigation.navigate('VendorDetail', {
                  vendorId: item.id,
                  vendorName: item.name,
                })
              }
            />
          )}
        />
      )}
    </View>
  );
}

const statusLabels: Record<string, string> = {
  pending: 'Order Placed',
  accepted: 'Approved',
  preparing: 'Preparing in Kitchen',
  ready_for_pickup: 'Ready for Pickup',
  picked_up: 'Picked up',
  delivering: 'On the Way',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 54, // Safe space for status bar since header is hidden
    gap: 14,
    backgroundColor: Colors.bgPrimary,
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -1,
    marginTop: 8,
  },
  bgBlob1: {
    position: 'absolute',
    top: 40,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.primary,
    opacity: 0.42,
    zIndex: -1,
  },
  bgBlob2: {
    position: 'absolute',
    bottom: 80,
    left: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: Colors.accent,
    opacity: 0.38,
    zIndex: -1,
  },
  searchContainer: {
    marginVertical: 2,
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  activeOrderBanner: {
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  bannerTextCol: {
    gap: 2,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  bannerArrow: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primaryDark,
  },
  segmentedControlContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 10,
    padding: 2,
    height: 38,
  },
  segmentBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  segmentBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  list: {
    gap: 12,
    paddingBottom: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: Colors.textSecondary,
    fontSize: 13,
  },
  empty: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
});
