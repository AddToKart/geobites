import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../utils/colors';
import { SellerDashboardScreen } from '../screens/seller/SellerDashboardScreen';
import { SellerShopScreen } from '../screens/seller/SellerShopScreen';
import { SellerMenuScreen } from '../screens/seller/SellerMenuScreen';

const Tab = createBottomTabNavigator();

export function SellerNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.bgCard,
          borderTopColor: Colors.borderColor,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
            SellerDashboard: 'list-outline',
            SellerMenu: 'restaurant-outline',
            SellerShop: 'storefront-outline',
          };
          return <Ionicons name={iconMap[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="SellerDashboard" 
        component={SellerDashboardScreen} 
        options={{ title: 'Orders' }} 
      />
      <Tab.Screen 
        name="SellerMenu" 
        component={SellerMenuScreen} 
        options={{ title: 'Menu' }} 
      />
      <Tab.Screen 
        name="SellerShop" 
        component={SellerShopScreen} 
        options={{ title: 'Shop' }} 
      />
    </Tab.Navigator>
  );
}
