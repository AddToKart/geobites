import '../models/menu_item.dart';
import '../core/api_client.dart';

class MenuService {
  Future<List<MenuItem>> getVendorMenu(String vendorId) async {
    try {
      final response = await apiClient.dio.get('/vendors/$vendorId/menu');
      final data = response.data;
      final List list = data is Map ? (data['data'] ?? []) : data;
      return list.map((m) => MenuItem.fromJson(m)).toList();
    } catch (e) {
      throw Exception('Failed to load menu: $e');
    }
  }

  // Helper method for the UI
  Future<MenuItem> addMenuItem(MenuItem item) async {
    return createMenuItem({
      'vendorId': item.vendorId,
      'name': item.name,
      'description': item.description,
      'price': item.price,
      'isAvailable': item.isAvailable,
      'imageUrl': item.imageUrl,
    });
  }

  Future<MenuItem> createMenuItem(Map<String, dynamic> payload) async {
    try {
      final response = await apiClient.dio.post('/menu', data: payload);
      return MenuItem.fromJson(response.data);
    } catch (e) {
      throw Exception('Failed to add menu item: $e');
    }
  }

  Future<MenuItem> updateMenuItem(String id, Map<String, dynamic> payload) async {
    try {
      // NestJS conventions usually prefer PATCH for partial updates
      final response = await apiClient.dio.patch('/menu/$id', data: payload);
      return MenuItem.fromJson(response.data);
    } catch (e) {
      throw Exception('Failed to update menu item: $e');
    }
  }

  Future<bool> deleteMenuItem(String id) async {
    try {
      final response = await apiClient.dio.delete('/menu/$id');
      return response.statusCode == 200 || response.statusCode == 204;
    } catch (e) {
      throw Exception('Failed to delete menu item: $e');
    }
  }
}

final menuService = MenuService();
