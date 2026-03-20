import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { NotificationsScreen } from '../screens/common/NotificationsScreen';
import { ProfileScreen } from '../screens/common/ProfileScreen';
import { DeliveriesScreen } from '../screens/rider/DeliveriesScreen';
import { DeliveryDetailScreen } from '../screens/rider/DeliveryDetailScreen';
import { RiderDeliveriesStackParamList, RiderTabParamList } from './types';
import { Colors } from '../utils/colors';

const Tab = createBottomTabNavigator<RiderTabParamList>();
const DeliveryStack = createNativeStackNavigator<RiderDeliveriesStackParamList>();

function DeliveryStackNavigator() {
  return (
    <DeliveryStack.Navigator>
      <DeliveryStack.Screen
        name="Deliveries"
        component={DeliveriesScreen}
        options={{ title: 'Deliveries' }}
      />
      <DeliveryStack.Screen
        name="DeliveryDetail"
        component={DeliveryDetailScreen}
        options={{ title: 'Delivery Detail' }}
      />
    </DeliveryStack.Navigator>
  );
}

export function RiderNavigator() {
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
            DeliveriesTab: 'bicycle-outline',
            NotificationsTab: 'notifications-outline',
            ProfileTab: 'person-outline',
          };
          return <Ionicons name={iconMap[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="DeliveriesTab" component={DeliveryStackNavigator} options={{ title: 'Deliveries' }} />
      <Tab.Screen name="NotificationsTab" component={NotificationsScreen} options={{ title: 'Alerts' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
