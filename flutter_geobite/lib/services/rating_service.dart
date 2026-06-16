import '../models/rating.dart';
import '../core/api_client.dart';

class RatingService {
  Future<void> submitRating(String orderId, int score, String? feedback) async {
    try {
      await apiClient.dio.post(
        '/ratings',
        data: {
          'orderId': orderId,
          'score': score,
          'feedback': feedback,
        },
      );
    } catch (e) {
      throw Exception('Failed to submit rating: $e');
    }
  }

  Future<VendorRatingSummary> getVendorRatings(String vendorId) async {
    try {
      final response = await apiClient.dio.get('/vendors/$vendorId/ratings');
      return VendorRatingSummary.fromJson(response.data);
    } catch (e) {
      throw Exception('Failed to fetch ratings: $e');
    }
  }
}

final ratingService = RatingService();
