import '../models/order.dart';
import '../core/api_client.dart';

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
      return list.map((o) => Order.fromJson(o)).toList();
    } catch (e) {
      throw Exception('Failed to load orders: $e');
    }
  }

  Future<Order> getOrder(String id) async {
    try {
      final response = await apiClient.dio.get('/orders/$id');
      return Order.fromJson(response.data);
    } catch (e) {
      throw Exception('Failed to load order: $e');
    }
  }

  Future<Order> placeOrder(Map<String, dynamic> payload) async {
    try {
      final response = await apiClient.dio.post('/orders', data: payload);
      return Order.fromJson(response.data);
    } catch (e) {
      throw Exception('Failed to place order: $e');
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
      return Order.fromJson(response.data);
    } catch (e) {
      throw Exception('Failed to update order status: $e');
    }
  }
}

final orderService = OrderService();
