import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { AppInput } from '../../components/common/AppInput';
import { VendorCard } from '../../components/ui/VendorCard';
import { getVendors } from '../../services/vendorService';
import { Vendor } from '../../types';
import { Colors } from '../../utils/colors';
import { CustomerBrowseStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<CustomerBrowseStackParamList, 'Browse'>;

export function BrowseScreen({ navigation }: Props) {
  const [search, setSearch] = useState('');
  const [vendors, setVendors] = useState<Vendor[]>([]);

  useEffect(() => {
    void (async () => {
      const response = await getVendors({ search, sortBy: 'rating', page: 1, limit: 20 });
      setVendors(response.data.filter((vendor) => vendor.isActive));
    })();
  }, [search]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Browse Vendors</Text>
      <AppInput value={search} onChangeText={setSearch} placeholder="Search vendors" />

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
      />
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
});
