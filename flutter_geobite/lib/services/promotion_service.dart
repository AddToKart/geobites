import '../core/api_client.dart';

class PromotionService {
  /// Get all active promotions
  Future<List<Map<String, dynamic>>> getPromotions() async {
    try {
      final response = await apiClient.dio.get('/promotions');
      final data = response.data;
      final List list = data is Map ? (data['data'] ?? []) : data;
      return list.cast<Map<String, dynamic>>();
    } catch (e) {
      throw Exception('Failed to load promotions: $e');
    }
  }

  /// Get promotions for a specific vendor
  Future<List<Map<String, dynamic>>> getVendorPromotions(String vendorId) async {
    try {
      final response = await apiClient.dio.get('/promotions/vendor/$vendorId');
      final data = response.data;
      final List list = data is Map ? (data['data'] ?? []) : data;
      return list.cast<Map<String, dynamic>>();
    } catch (e) {
      throw Exception('Failed to load vendor promotions: $e');
    }
  }

  /// Create a promotion (seller only)
  Future<Map<String, dynamic>> createPromotion(Map<String, dynamic> payload) async {
    try {
      final response = await apiClient.dio.post('/promotions', data: payload);
      return Map<String, dynamic>.from(response.data);
    } catch (e) {
      throw Exception('Failed to create promotion: $e');
    }
  }

  /// Update a promotion (seller only)
  Future<Map<String, dynamic>> updatePromotion(String id, Map<String, dynamic> payload) async {
    try {
      final response = await apiClient.dio.patch('/promotions/$id', data: payload);
      return Map<String, dynamic>.from(response.data);
    } catch (e) {
      throw Exception('Failed to update promotion: $e');
    }
  }

  /// Delete a promotion (seller only)
  Future<void> deletePromotion(String id) async {
    try {
      await apiClient.dio.delete('/promotions/$id');
    } catch (e) {
      throw Exception('Failed to delete promotion: $e');
    }
  }
}

final promotionService = PromotionService();
