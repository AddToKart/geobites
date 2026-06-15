import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { AppInput } from '../../components/common/AppInput';
import { VendorCard } from '../../components/ui/VendorCard';
import { useDebounce } from '../../hooks/useDebounce';
import { getVendors } from '../../services/vendorService';
import { Vendor } from '../../types';
import { Colors } from '../../utils/colors';
import { CustomerBrowseStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<CustomerBrowseStackParamList, 'Browse'>;

export function BrowseScreen({ navigation }: Props) {
  const [search, setSearch] = useState('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Debounce the search term — only fires the API after 350ms of inactivity,
  // preventing an HTTP request per keystroke.
  const debouncedSearch = useDebounce(search, 350);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const response = await getVendors({
          search: debouncedSearch,
          sortBy: 'rating',
          page: 1,
          limit: 20,
        });
        if (!cancelled) {
          setVendors(response.data.filter((vendor) => vendor.isActive));
        }
      } catch {
        if (!cancelled) setVendors([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Browse Vendors</Text>
      <AppInput value={search} onChangeText={setSearch} placeholder="Search restaurants or dishes" />

      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={Colors.primary ?? '#ff5a00'}
          style={styles.spinner}
        />
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={vendors}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <VendorCard
              vendor={item}
              onPress={() =>
                navigation.navigate('VendorDetail', {
                  vendorId: item.id,
                  vendorName: item.name,
                })
              }
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {debouncedSearch ? 'No restaurants found.' : 'No restaurants available.'}
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
    backgroundColor: Colors.bgPrimary,
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
  spinner: {
    marginTop: 40,
  },
  empty: {
    marginTop: 40,
    textAlign: 'center',
    color: Colors.textSecondary ?? Colors.textPrimary,
    fontSize: 15,
  },
});
