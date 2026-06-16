import '../core/api_client.dart';

class FavoritesService {
  /// Returns a list of favorite vendor records for the current user.
  Future<List<Map<String, dynamic>>> getFavorites() async {
    try {
      final response = await apiClient.dio.get('/favorites');
      final data = response.data;
      final List list = data is Map ? (data['data'] ?? data['favorites'] ?? []) : data;
      return list.cast<Map<String, dynamic>>();
    } catch (e) {
      throw Exception('Failed to load favorites: $e');
    }
  }

  /// Adds a vendor to the current user's favorites.
  Future<Map<String, dynamic>> addFavorite(String vendorId) async {
    try {
      final response = await apiClient.dio.post('/favorites', data: {'vendorId': vendorId});
      return Map<String, dynamic>.from(response.data);
    } catch (e) {
      throw Exception('Failed to add favorite: $e');
    }
  }

  /// Removes a vendor from the current user's favorites.
  Future<void> removeFavorite(String vendorId) async {
    try {
      await apiClient.dio.delete('/favorites/$vendorId');
    } catch (e) {
      throw Exception('Failed to remove favorite: $e');
    }
  }
}

final favoritesService = FavoritesService();
