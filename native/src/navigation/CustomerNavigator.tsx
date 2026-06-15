import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { CartScreen } from '../screens/customer/CartScreen';
import { BrowseScreen } from '../screens/customer/BrowseScreen';
import { OrderDetailScreen } from '../screens/customer/OrderDetailScreen';
import { OrdersScreen } from '../screens/customer/OrdersScreen';
import { VendorDetailScreen } from '../screens/customer/VendorDetailScreen';
import { NotificationsScreen } from '../screens/common/NotificationsScreen';
import { ProfileScreen } from '../screens/common/ProfileScreen';
import {
  CustomerBrowseStackParamList,
  CustomerOrdersStackParamList,
  CustomerTabParamList,
} from './types';
import { Colors } from '../utils/colors';

const Tab = createBottomTabNavigator<CustomerTabParamList>();
const BrowseStack = createNativeStackNavigator<CustomerBrowseStackParamList>();
const OrdersStack = createNativeStackNavigator<CustomerOrdersStackParamList>();

function CustomerBrowseStackNavigator() {
  return (
    <BrowseStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: 'transparent',
        },
        headerTitleStyle: {
          fontWeight: '700',
          color: Colors.textPrimary,
        },
        headerTintColor: Colors.primary,
      }}
    >
      <BrowseStack.Screen 
        name="Browse" 
        component={BrowseScreen} 
        options={{ headerShown: false }} 
      />
      <BrowseStack.Screen
        name="VendorDetail"
        component={VendorDetailScreen}
        options={({ route }) => ({ 
          title: route.params.vendorName,
          headerTransparent: true,
        })}
      />
      <BrowseStack.Screen 
        name="Cart" 
        component={CartScreen} 
        options={{ 
          title: '',
          headerTransparent: true,
        }}
      />
      <BrowseStack.Screen 
        name="OrderDetail" 
        component={OrderDetailScreen} 
        options={{ 
          title: '',
          headerTransparent: true,
        }} 
      />
    </BrowseStack.Navigator>
  );
}

function CustomerOrdersStackNavigator() {
  return (
    <OrdersStack.Navigator>
      <OrdersStack.Screen name="Orders" component={OrdersScreen} options={{ title: 'My Orders' }} />
      <OrdersStack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Order' }} />
    </OrdersStack.Navigator>
  );
}

export function CustomerNavigator() {
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
            BrowseTab: 'storefront-outline',
            OrdersTab: 'receipt-outline',
            NotificationsTab: 'notifications-outline',
            ProfileTab: 'person-outline',
          };

          return <Ionicons name={iconMap[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="BrowseTab" component={CustomerBrowseStackNavigator} options={{ title: 'Browse' }} />
      <Tab.Screen name="OrdersTab" component={CustomerOrdersStackNavigator} options={{ title: 'Orders' }} />
      <Tab.Screen name="NotificationsTab" component={NotificationsScreen} options={{ title: 'Alerts' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
