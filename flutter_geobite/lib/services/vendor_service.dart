import '../models/vendor.dart';
import '../core/api_client.dart';

class VendorService {
  Future<List<Vendor>> getVendors() async {
    try {
      final response = await apiClient.dio.get('/vendors');
      // Adjust according to backend response structure
      // For NestJS, it might return the array directly or inside { "data": [...] }
      final data = response.data;
      final List list = data is Map ? (data['data'] ?? []) : data;
      return list.map((v) => Vendor.fromJson(v)).toList();
    } catch (e) {
      throw Exception('Failed to load vendors: $e');
    }
  }

  Future<Vendor> getVendorById(String id) async {
    try {
      final response = await apiClient.dio.get('/vendors/$id');
      return Vendor.fromJson(response.data);
    } catch (e) {
      throw Exception('Failed to load vendor details: $e');
    }
  }

  Future<Vendor> createVendor(Map<String, dynamic> payload) async {
    try {
      final response = await apiClient.dio.post('/vendors', data: payload);
      return Vendor.fromJson(response.data);
    } catch (e) {
      throw Exception('Failed to create vendor: $e');
    }
  }

  Future<Vendor> updateVendor(String id, Map<String, dynamic> payload) async {
    try {
      // NestJS uses PUT
      final response = await apiClient.dio.put('/vendors/$id', data: payload);
      return Vendor.fromJson(response.data);
    } catch (e) {
      throw Exception('Failed to update vendor: $e');
    }
  }
}

final vendorService = VendorService();
