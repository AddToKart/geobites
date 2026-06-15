import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Colors } from '../utils/colors';
import { SellerDashboardScreen } from '../screens/seller/SellerDashboardScreen';
import { SellerShopScreen } from '../screens/seller/SellerShopScreen';

const Tab = createBottomTabNavigator();

export function SellerNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.bgCard,
          borderTopColor: Colors.borderColor,
        },
      }}
    >
      <Tab.Screen 
        name="SellerDashboard" 
        component={SellerDashboardScreen} 
        options={{ title: 'Orders Dashboard' }} 
      />
      <Tab.Screen 
        name="SellerShop" 
        component={SellerShopScreen} 
        options={{ title: 'My Shop' }} 
      />
    </Tab.Navigator>
  );
}
