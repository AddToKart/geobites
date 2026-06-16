import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'package:flutter_dotenv/flutter_dotenv.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;

  late Dio dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  // Load from .env
  static String get baseUrl => dotenv.env['API_URL'] ?? 'http://192.168.1.13:3000/api';

  ApiClient._internal() {
    dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': 'http://localhost:3000',
        },
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Inject JWT token
          final token = await _storage.read(key: 'jwt_token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
            options.headers['Cookie'] = 'better-auth.session_token=$token';
          }
          return handler.next(options);
        },
        onError: (DioException e, handler) async {
          // Handle 401 Unauthorized globally if needed (e.g., refresh token or force logout)
          if (e.response?.statusCode == 401) {
            // Token expired or invalid
            await _storage.delete(key: 'jwt_token');
            // TODO: Dispatch logout event
          }
          return handler.next(e);
        },
      ),
    );

    // Optional: Add logging in debug mode
    dio.interceptors.add(LogInterceptor(responseBody: true, requestBody: true));
  }
}

final apiClient = ApiClient();
