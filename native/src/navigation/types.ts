import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type CustomerBrowseStackParamList = {
  Browse: undefined;
  VendorDetail: { vendorId: string; vendorName: string };
  Cart: undefined;
  OrderDetail: { orderId: string };
};

export type CustomerOrdersStackParamList = {
  Orders: undefined;
  OrderDetail: { orderId: string };
};

export type RiderDeliveriesStackParamList = {
  Deliveries: undefined;
  DeliveryDetail: { orderId: string };
};

export type CustomerTabParamList = {
  BrowseTab: NavigatorScreenParams<CustomerBrowseStackParamList>;
  OrdersTab: NavigatorScreenParams<CustomerOrdersStackParamList>;
  NotificationsTab: undefined;
  ProfileTab: undefined;
};

export type RiderTabParamList = {
  DeliveriesTab: NavigatorScreenParams<RiderDeliveriesStackParamList>;
  NotificationsTab: undefined;
  ProfileTab: undefined;
};
