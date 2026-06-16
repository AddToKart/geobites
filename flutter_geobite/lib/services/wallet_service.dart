import '../core/api_client.dart';

class WalletService {
  /// Get the current user's wallet balance
  Future<Map<String, dynamic>> getWallet() async {
    try {
      final response = await apiClient.dio.get('/wallet/balance');
      return Map<String, dynamic>.from(response.data);
    } catch (e) {
      throw Exception('Failed to load wallet: $e');
    }
  }

  /// Get paginated wallet transactions
  Future<Map<String, dynamic>> getTransactions({int page = 1, int limit = 15}) async {
    try {
      final response = await apiClient.dio.get(
        '/wallet/transactions',
        queryParameters: {'page': page, 'limit': limit},
      );
      return Map<String, dynamic>.from(response.data);
    } catch (e) {
      throw Exception('Failed to load transactions: $e');
    }
  }

  /// Initiate a cash-in / top-up
  Future<Map<String, dynamic>> initiateCashIn(double amount, String paymentMethod) async {
    try {
      final response = await apiClient.dio.post('/wallet/cash-in', data: {
        'amount': amount,
        'paymentMethod': paymentMethod,
      });
      return Map<String, dynamic>.from(response.data);
    } catch (e) {
      throw Exception('Failed to initiate cash-in: $e');
    }
  }

  // ── Vendor wallet ──────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> initiateVendorCashIn(double amount, String paymentMethod) async {
    try {
      final response = await apiClient.dio.post('/wallet/vendor/cash-in', data: {
        'amount': amount,
        'paymentMethod': paymentMethod,
      });
      return Map<String, dynamic>.from(response.data);
    } catch (e) {
      throw Exception('Failed to initiate vendor cash-in: $e');
    }
  }

  Future<Map<String, dynamic>> getVendorWallet() async {
    try {
      final response = await apiClient.dio.get('/wallet/vendor');
      return Map<String, dynamic>.from(response.data);
    } catch (e) {
      throw Exception('Failed to load vendor wallet: $e');
    }
  }

  Future<List<Map<String, dynamic>>> getVendorTransactions() async {
    try {
      final response = await apiClient.dio.get('/wallet/vendor/transactions');
      final List list = response.data is List ? response.data : [];
      return list.cast<Map<String, dynamic>>();
    } catch (e) {
      throw Exception('Failed to load vendor transactions: $e');
    }
  }

  Future<Map<String, dynamic>> requestVendorWithdrawal(
    double amount,
    Map<String, String> accountDetails,
  ) async {
    try {
      final response = await apiClient.dio.post('/wallet/vendor/withdraw', data: {
        'amount': amount,
        ...accountDetails,
      });
      return Map<String, dynamic>.from(response.data);
    } catch (e) {
      throw Exception('Failed to request vendor withdrawal: $e');
    }
  }

  Future<List<Map<String, dynamic>>> getVendorWithdrawals() async {
    try {
      final response = await apiClient.dio.get('/wallet/vendor/withdrawals');
      final List list = response.data is List ? response.data : [];
      return list.cast<Map<String, dynamic>>();
    } catch (e) {
      throw Exception('Failed to load vendor withdrawals: $e');
    }
  }

  // ── Customer withdrawals ───────────────────────────────────────────────────

  Future<Map<String, dynamic>> requestCustomerWithdrawal(
    double amount,
    Map<String, String> accountDetails,
  ) async {
    try {
      final response = await apiClient.dio.post('/wallet/withdraw', data: {
        'amount': amount,
        ...accountDetails,
      });
      return Map<String, dynamic>.from(response.data);
    } catch (e) {
      throw Exception('Failed to request withdrawal: $e');
    }
  }

  Future<List<Map<String, dynamic>>> getCustomerWithdrawals() async {
    try {
      final response = await apiClient.dio.get('/wallet/withdrawals');
      final List list = response.data is List ? response.data : [];
      return list.cast<Map<String, dynamic>>();
    } catch (e) {
      throw Exception('Failed to load withdrawals: $e');
    }
  }
  /// Get rider earnings grouped by date, plus weekly total
  Future<Map<String, dynamic>> getRiderEarnings() async {
    try {
      final response = await apiClient.dio.get('/wallet/rider/earnings');
      return Map<String, dynamic>.from(response.data);
    } catch (e) {
      throw Exception('Failed to load rider earnings: $e');
    }
  }
}

final walletService = WalletService();
