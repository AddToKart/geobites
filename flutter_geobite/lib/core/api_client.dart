import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;

  late Dio dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  /// REST API base URL — platform-aware.
  /// Flutter Web can reach localhost directly.
  /// Android emulator uses 10.0.2.2 to reach the host machine's localhost.
  static String get baseUrl {
    if (kIsWeb) {
      return dotenv.env['API_URL_WEB'] ?? 'http://localhost:3000/api';
    }
    final envUrl = dotenv.env['API_URL'];
    if (envUrl != null) {
      String resolvedUrl = envUrl;
      try {
        if (Platform.isAndroid && resolvedUrl.contains('localhost')) {
          resolvedUrl = resolvedUrl.replaceAll('localhost', '10.0.2.2');
        }
      } catch (_) {}
      return resolvedUrl;
    }
    try {
      if (Platform.isIOS) {
        return 'http://localhost:3000/api';
      }
    } catch (_) {}
    return 'http://10.0.2.2:3000/api';
  }

  /// WebSocket server URL — strip the /api suffix
  static String get socketUrl => baseUrl.replaceAll('/api', '');

  ApiClient._internal() {
    // 'Origin' and 'Cookie' are FORBIDDEN headers on Flutter Web.
    // The browser sets 'Origin' automatically and refuses to let JS override it.
    // 'Cookie' is also forbidden — the browser manages it via withCredentials.
    // Only set these headers on native mobile (Android/iOS).
    final Map<String, dynamic> baseHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (!kIsWeb) 'Origin': socketUrl,
    };

    dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        headers: baseHeaders,
        // withCredentials: true tells the browser to include cookies on
        // cross-origin requests (localhost:Flutter-port → localhost:3000).
        // This is the web equivalent of manually setting the Cookie header.
        extra: kIsWeb ? {'withCredentials': true} : {},
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.read(key: 'jwt_token');
          if (token != null) {
            // Bearer token works on all platforms — validated by SessionGuard.
            options.headers['Authorization'] = 'Bearer $token';

            // On Flutter Web the browser refuses to set Cookie manually.
            // The browser automatically sends the session cookie (set by Better Auth
            // on sign-in) because withCredentials = true is set above.
            if (!kIsWeb) {
              options.headers['Cookie'] = 'better-auth.session_token=$token';
            }
          }
          return handler.next(options);
        },
        onError: (DioException e, handler) async {
          if (e.response?.statusCode == 401) {
            await _storage.delete(key: 'jwt_token');
          }
          return handler.next(e);
        },
      ),
    );

    dio.interceptors.add(LogInterceptor(responseBody: true, requestBody: true));
  }
}

final apiClient = ApiClient();

