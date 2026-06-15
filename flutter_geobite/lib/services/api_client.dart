import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  // Use 10.0.2.2 for Android Emulator, localhost for iOS
  static const String baseUrl = 'http://10.0.2.2:3000/api';
  static const String cookieKey = 'geobites_cookie';

  final http.Client _client = http.Client();

  Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final cookie = prefs.getString(cookieKey);
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (cookie != null && cookie.isNotEmpty) {
      headers['Cookie'] = cookie;
    }
    return headers;
  }

  void _updateCookie(http.Response response) async {
    final rawCookie = response.headers['set-cookie'];
    if (rawCookie != null) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(cookieKey, rawCookie);
    }
  }

  Future<http.Response> get(String endpoint) async {
    final headers = await _getHeaders();
    final response = await _client.get(Uri.parse('$baseUrl$endpoint'), headers: headers);
    _updateCookie(response);
    return response;
  }

  Future<http.Response> post(String endpoint, {Map<String, dynamic>? body}) async {
    final headers = await _getHeaders();
    final response = await _client.post(
      Uri.parse('$baseUrl$endpoint'),
      headers: headers,
      body: body != null ? jsonEncode(body) : null,
    );
    _updateCookie(response);
    return response;
  }

  Future<http.Response> put(String endpoint, {Map<String, dynamic>? body}) async {
    final headers = await _getHeaders();
    final response = await _client.put(
      Uri.parse('$baseUrl$endpoint'),
      headers: headers,
      body: body != null ? jsonEncode(body) : null,
    );
    _updateCookie(response);
    return response;
  }

  Future<http.Response> delete(String endpoint) async {
    final headers = await _getHeaders();
    final response = await _client.delete(Uri.parse('$baseUrl$endpoint'), headers: headers);
    _updateCookie(response);
    return response;
  }
}

final apiClient = ApiClient();
