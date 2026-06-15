import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';
import '../core/api_client.dart';

class AuthService {
  static const String sessionKey = 'geobites_user_data';
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  Future<User> signIn(String email, String password) async {
    try {
      final response = await apiClient.dio.post('/auth/sign-in/email', data: {
        'email': email,
        'password': password,
      });

      String? token;
      
      final setCookie = response.headers.map['set-cookie'] ?? response.headers.map['Set-Cookie'];
      if (setCookie != null) {
        for (var c in setCookie) {
          if (c.contains('better-auth.session_token=')) {
            token = c.split('better-auth.session_token=')[1].split(';')[0];
            break;
          }
        }
      }

      if (token == null && response.data is Map) {
        token = response.data['token'] ?? (response.data['session'] != null ? response.data['session']['token'] : null);
      }

      if (token != null) {
        await _storage.write(key: 'jwt_token', value: token);
      } else {
        throw Exception('Failed to extract authentication token from server');
      }

      final user = await getSession();
      if (user == null) {
        throw Exception('Unable to fetch session after login');
      }
      return user;
    } catch (e) {
      throw Exception('Failed to sign in: $e');
    }
  }

  Future<User> signUp({
    required String name,
    required String email,
    required String password,
    required String role,
    String? phone,
  }) async {
    try {
      final data = {
        'name': name,
        'email': email,
        'password': password,
        'role': role,
      };
      if (phone != null && phone.isNotEmpty) {
        data['phone'] = phone;
      }

      final response = await apiClient.dio.post('/auth/sign-up/email', data: data);

      String? token;
      
      final setCookie = response.headers.map['set-cookie'] ?? response.headers.map['Set-Cookie'];
      if (setCookie != null) {
        for (var c in setCookie) {
          if (c.contains('better-auth.session_token=')) {
            token = c.split('better-auth.session_token=')[1].split(';')[0];
            break;
          }
        }
      }

      if (token == null && response.data is Map) {
        token = response.data['token'] ?? (response.data['session'] != null ? response.data['session']['token'] : null);
      }

      if (token != null) {
        await _storage.write(key: 'jwt_token', value: token);
      } else {
        throw Exception('Failed to extract authentication token from server');
      }

      final user = await getSession();
      if (user == null) {
        throw Exception('Unable to fetch session after register');
      }
      return user;
    } catch (e) {
      throw Exception('Failed to sign up: $e');
    }
  }

  Future<void> signOut() async {
    try {
      await apiClient.dio.post('/auth/sign-out');
    } catch (_) {}
    
    await _storage.delete(key: 'jwt_token');
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(sessionKey);
  }

  Future<User?> getSession() async {
    try {
      final token = await _storage.read(key: 'jwt_token');
      if (token == null) return null;

      final response = await apiClient.dio.get('/auth/get-session');
      
      if (response.statusCode == 200 && response.data != null && response.data['user'] != null) {
        final userData = response.data['user'];
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(sessionKey, jsonEncode(userData));
        return User.fromJson(userData);
      }
    } catch (e) {
      print('Error fetching user from API, falling back to cache: $e');
    }

    // Fallback to cache if offline but still have a token
    final prefs = await SharedPreferences.getInstance();
    final cached = prefs.getString(sessionKey);
    if (cached != null) {
      return User.fromJson(jsonDecode(cached));
    }
    return null;
  }
}

final authService = AuthService();
