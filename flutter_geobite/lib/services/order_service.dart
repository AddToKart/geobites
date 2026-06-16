import '../models/order.dart';
import '../core/api_client.dart';
import '../database/database_helper.dart';
import 'dart:convert';

class OrderService {
  Future<List<Order>> getOrders({String? status, int page = 1, int limit = 100}) async {
    try {
      final Map<String, dynamic> queryParameters = {
        'page': page,
        'limit': limit,
      };
      if (status != null && status.isNotEmpty) {
        queryParameters['status'] = status;
      }
      
      final response = await apiClient.dio.get('/orders', queryParameters: queryParameters);
      final data = response.data;
      final List list = data is Map ? (data['data'] ?? []) : data;
      final orders = list.map((o) => Order.fromJson(o)).toList();

      // Cache orders locally to SQLite
      for (var order in orders) {
        await DatabaseHelper.instance.upsertOrder(order.toSqlMap());
      }
      
      return orders;
    } catch (e) {
      print('API Error (getOrders), falling back to SQLite: $e');
      final localOrdersData = await DatabaseHelper.instance.getAllOrders();
      final localOrders = localOrdersData.map((o) => Order.fromSqlMap(o)).toList();
      
      if (status != null && status.isNotEmpty) {
        return localOrders.where((o) => o.status == status).toList();
      }
      return localOrders;
    }
  }

  Future<Order> getOrder(String id) async {
    try {
      final response = await apiClient.dio.get('/orders/$id');
      final order = Order.fromJson(response.data);
      // Cache this single order
      await DatabaseHelper.instance.upsertOrder(order.toSqlMap());
      return order;
    } catch (e) {
      print('API Error (getOrder), falling back to SQLite: $e');
      final localOrdersData = await DatabaseHelper.instance.getAllOrders();
      final orderMap = localOrdersData.firstWhere((o) => o['id'] == id, orElse: () => <String, dynamic>{});
      if (orderMap.isEmpty) {
        throw Exception('Failed to load order: $e');
      }
      return Order.fromSqlMap(orderMap);
    }
  }

  Future<Order> placeOrder(Map<String, dynamic> payload) async {
    try {
      final response = await apiClient.dio.post('/orders', data: payload);
      final order = Order.fromJson(response.data);
      await DatabaseHelper.instance.upsertOrder(order.toSqlMap());
      return order;
    } catch (e) {
      print('API Error (placeOrder), queuing offline: $e');
      
      // Save locally to offline queue
      await DatabaseHelper.instance.enqueueAction('PLACE_ORDER', jsonEncode(payload));
      
      // Return a temporary local object so the UI succeeds
      final tempOrder = Order(
        id: 'local-${DateTime.now().millisecondsSinceEpoch}',
        customerId: payload['customerId']?.toString() ?? 'local_user',
        vendorId: payload['vendorId'],
        status: 'pending',
        totalAmount: payload['totalAmount']?.toDouble() ?? 0.0,
        deliveryAddress: payload['deliveryAddress'] ?? 'No Address',
        items: [],
        createdAt: DateTime.now().toIso8601String(),
        updatedAt: DateTime.now().toIso8601String(),
      );
      await DatabaseHelper.instance.upsertOrder(tempOrder.toSqlMap());
      return tempOrder;
    }
  }

  Future<Order> placePosOrder(Map<String, dynamic> payload) async {
    try {
      final response = await apiClient.dio.post('/orders/pos', data: payload);
      return Order.fromJson(response.data);
    } catch (e) {
      throw Exception('Failed to place POS order: $e');
    }
  }

  Future<Order> updateOrderStatus(String id, String status) async {
    try {
      // Typically REST APIs use PATCH for partial updates like status
      final response = await apiClient.dio.patch('/orders/$id/status', data: {'status': status});
      final order = Order.fromJson(response.data);
      await DatabaseHelper.instance.upsertOrder(order.toSqlMap());
      return order;
    } catch (e) {
      print('API Error (updateOrderStatus), queuing offline: $e');
      
      // Queue offline
      await DatabaseHelper.instance.enqueueAction('UPDATE_STATUS', jsonEncode({
        'orderId': id,
        'status': status,
      }));

      // Update the local database object so UI reflects it immediately
      final localOrdersData = await DatabaseHelper.instance.getAllOrders();
      final orderMap = localOrdersData.firstWhere((o) => o['id'] == id, orElse: () => <String, dynamic>{});
      if (orderMap.isNotEmpty) {
        final Map<String, dynamic> mutableMap = Map<String, dynamic>.from(orderMap);
        mutableMap['status'] = status;
        await DatabaseHelper.instance.upsertOrder(mutableMap);
        return Order.fromSqlMap(mutableMap);
      }
      throw Exception('Failed to update order status: $e');
    }
  }
}

final orderService = OrderService();
