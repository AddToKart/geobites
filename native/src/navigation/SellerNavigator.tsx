import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../utils/colors';

const Tab = createBottomTabNavigator();

function SellerDashboardStub() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Seller Dashboard</Text>
      <Text style={styles.subtitle}>Mobile seller features coming soon!</Text>
    </View>
  );
}

export function SellerNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSoft,
      }}
    >
      <Tab.Screen 
        name="SellerHome" 
        component={SellerDashboardStub} 
        options={{ title: 'Dashboard' }} 
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgPrimary,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSoft,
    marginTop: 8,
  },
});
