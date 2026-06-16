import '../core/api_client.dart';

class VoucherService {
  /// Get vendor's own vouchers (seller role)
  Future<List<Map<String, dynamic>>> getMyVouchers() async {
    try {
      final response = await apiClient.dio.get('/vouchers/vendor');
      final List list = response.data is List ? response.data : [];
      return list.cast<Map<String, dynamic>>();
    } catch (e) {
      throw Exception('Failed to load vouchers: $e');
    }
  }

  /// Create a new voucher (seller only)
  Future<Map<String, dynamic>> createVoucher(Map<String, dynamic> payload) async {
    try {
      final response = await apiClient.dio.post('/vouchers/vendor', data: payload);
      return Map<String, dynamic>.from(response.data);
    } catch (e) {
      throw Exception('Failed to create voucher: $e');
    }
  }

  /// Update an existing voucher (seller only)
  Future<Map<String, dynamic>> updateVoucher(String id, Map<String, dynamic> payload) async {
    try {
      final response = await apiClient.dio.put('/vouchers/vendor/$id', data: payload);
      return Map<String, dynamic>.from(response.data);
    } catch (e) {
      throw Exception('Failed to update voucher: $e');
    }
  }

  /// Delete a voucher (seller only)
  Future<void> deleteVoucher(String id) async {
    try {
      await apiClient.dio.delete('/vouchers/vendor/$id');
    } catch (e) {
      throw Exception('Failed to delete voucher: $e');
    }
  }

  /// Get active vouchers for a specific vendor (customer browsing)
  Future<List<Map<String, dynamic>>> getActiveVouchers(String vendorId) async {
    try {
      final response = await apiClient.dio.get('/vouchers/vendor/$vendorId/active');
      final List list = response.data is List ? response.data : [];
      return list.cast<Map<String, dynamic>>();
    } catch (e) {
      throw Exception('Failed to load vendor vouchers: $e');
    }
  }

  /// Validate a voucher code before applying it to an order
  Future<Map<String, dynamic>> validateVoucherCode({
    required String code,
    required String vendorId,
    required double orderAmount,
  }) async {
    try {
      final response = await apiClient.dio.post('/vouchers/validate', data: {
        'code': code,
        'vendorId': vendorId,
        'orderAmount': orderAmount,
      });
      return Map<String, dynamic>.from(response.data);
    } catch (e) {
      throw Exception('Failed to validate voucher: $e');
    }
  }
}

final voucherService = VoucherService();
