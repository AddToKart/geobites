import '../core/api_client.dart';

class GeopayService {
  /// Get current customer's rewards balance (points, discount balance, lifetime earned/redeemed)
  Future<Map<String, dynamic>> getRewardsBalance() async {
    try {
      final response = await apiClient.dio.get('/geopay/rewards/balance');
      return Map<String, dynamic>.from(response.data);
    } catch (e) {
      throw Exception('Failed to load rewards balance: $e');
    }
  }

  /// Get rewards points history
  Future<List<Map<String, dynamic>>> getRewardHistory() async {
    try {
      final response = await apiClient.dio.get('/geopay/rewards/history');
      final data = response.data;
      final List list = data is List ? data : [];
      return list.cast<Map<String, dynamic>>();
    } catch (e) {
      throw Exception('Failed to load reward history: $e');
    }
  }

  /// Redeem loyalty points for discount balance (10 points = ₱1 discount)
  Future<Map<String, dynamic>> redeemPoints(int points) async {
    try {
      final response = await apiClient.dio.post('/geopay/rewards/redeem', data: {
        'points': points,
      });
      return Map<String, dynamic>.from(response.data);
    } catch (e) {
      throw Exception('Failed to redeem points: $e');
    }
  }

  /// Consume discount pesos
  Future<Map<String, dynamic>> consumeDiscount(double discountPesos) async {
    try {
      final response = await apiClient.dio.post('/geopay/rewards/consume-discount', data: {
        'discountPesos': discountPesos,
      });
      return Map<String, dynamic>.from(response.data);
    } catch (e) {
      throw Exception('Failed to consume discount: $e');
    }
  }

  /// Get referral code, total, and pending referrals
  Future<Map<String, dynamic>> getReferralCode() async {
    try {
      final response = await apiClient.dio.get('/geopay/referral/code');
      return Map<String, dynamic>.from(response.data);
    } catch (e) {
      throw Exception('Failed to load referral code: $e');
    }
  }

  /// Register a referral code
  Future<Map<String, dynamic>> registerReferral(String code, String? email) async {
    try {
      final response = await apiClient.dio.post('/geopay/referral/register', data: {
        'code': code,
        if (email != null) 'email': email,
      });
      return Map<String, dynamic>.from(response.data);
    } catch (e) {
      throw Exception('Failed to register referral code: $e');
    }
  }

  /// Get referral history (referred signups and status)
  Future<List<Map<String, dynamic>>> getReferralHistory() async {
    try {
      final response = await apiClient.dio.get('/geopay/referral/history');
      final data = response.data;
      final List list = data is List ? data : [];
      return list.cast<Map<String, dynamic>>();
    } catch (e) {
      throw Exception('Failed to load referral history: $e');
    }
  }
}

final geopayService = GeopayService();
