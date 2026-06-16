import '../models/vendor.dart';
import '../core/api_client.dart';

class PaginatedVendors {
  final List<Vendor> data;
  final int total;
  final int page;
  final int limit;

  PaginatedVendors({
    required this.data,
    required this.total,
    required this.page,
    required this.limit,
  });

  bool get hasMore => page * limit < total;
}

class VendorService {
  /// Compatibility shim — returns first page of vendors as a flat list.
  /// Seller screens use this to fetch their own store (first result).
  Future<List<Vendor>> getVendors({int limit = 200}) async {
    final result = await getVendorsPaginated(page: 1, limit: limit);
    return result.data;
  }

  /// Fetch a single page of vendors from the backend.
  Future<PaginatedVendors> getVendorsPaginated({
    int page = 1,
    int limit = 12,
    String? search,
    String? sortBy,
  }) async {
    try {
      final response = await apiClient.dio.get(
        '/vendors',
        queryParameters: {
          'page': page,
          'limit': limit,
          if (search != null && search.isNotEmpty) 'search': search,
          if (sortBy != null) 'sortBy': sortBy,
        },
      );
      final data = response.data;
      final List list = data is Map ? (data['data'] ?? []) : data;
      final total = data is Map
          ? (data['total'] as num?)?.toInt() ?? list.length
          : list.length;
      return PaginatedVendors(
        data: list.map((v) => Vendor.fromJson(v)).toList(),
        total: total,
        page: page,
        limit: limit,
      );
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
      final response = await apiClient.dio.put('/vendors/$id', data: payload);
      return Vendor.fromJson(response.data);
    } catch (e) {
      throw Exception('Failed to update vendor: $e');
    }
  }
}

final vendorService = VendorService();
