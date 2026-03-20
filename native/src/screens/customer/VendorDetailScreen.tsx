import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../components/common/AppButton';
import { MenuItemCard } from '../../components/ui/MenuItemCard';
import { useCart } from '../../context/CartContext';
import { getVendorMenu } from '../../services/menuService';
import { MenuItem } from '../../types';
import { Colors } from '../../utils/colors';
import { CustomerBrowseStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<CustomerBrowseStackParamList, 'VendorDetail'>;

export function VendorDetailScreen({ route, navigation }: Props) {
  const { vendorId, vendorName } = route.params;
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const { items, addItem, updateQuantity } = useCart();

  useEffect(() => {
    void (async () => {
      const response = await getVendorMenu(vendorId);
      setMenuItems(response);
    })();
  }, [vendorId]);

  const quantityMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      map.set(item.menuItem.id, item.quantity);
    }
    return map;
  }, [items]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{vendorName}</Text>

      <FlatList
        contentContainerStyle={styles.list}
        data={menuItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MenuItemCard
            menuItem={item}
            quantity={quantityMap.get(item.id) ?? 0}
            onAdd={() => addItem(item)}
            onRemove={() => updateQuantity(item.id, (quantityMap.get(item.id) ?? 0) - 1)}
          />
        )}
      />

      <AppButton
        label={`Go to Cart (${items.reduce((sum, item) => sum + item.quantity, 0)})`}
        onPress={() => navigation.navigate('Cart')}
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
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  list: {
    gap: 10,
    paddingBottom: 16,
  },
});
