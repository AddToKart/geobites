import 'package:flutter/material.dart';
import '../models/user.dart';
import '../services/auth_service.dart';
import '../services/socket_service.dart';

class AuthProvider with ChangeNotifier {
  User? _user;
  bool _isLoading = true;

  User? get user => _user;
  bool get isAuthenticated => _user != null;
  bool get isLoading => _isLoading;

  Future<void> checkSession() async {
    _isLoading = true;
    notifyListeners();
    try {
      _user = await authService.getSession();
      if (_user != null) {
        _initSocket(_user!);
      }
    } catch (e) {
      print('Session check failed: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> signIn(String email, String password) async {
    _isLoading = true;
    notifyListeners();
    try {
      _user = await authService.signIn(email, password);
      if (_user != null) {
        _initSocket(_user!);
      }
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> signUp({
    required String name,
    required String email,
    required String password,
    required String role,
    String? phone,
  }) async {
    _isLoading = true;
    notifyListeners();
    try {
      _user = await authService.signUp(
        name: name,
        email: email,
        password: password,
        role: role,
        phone: phone,
      );
      if (_user != null) {
        _initSocket(_user!);
      }
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> signOut() async {
    try {
      await authService.signOut();
    } catch (e) {
      print('Error during sign out: $e');
    } finally {
      SocketService().disconnect();
      _user = null;
      notifyListeners();
    }
  }

  void _initSocket(User user) {
    SocketService().connect();
    // Join generic role room
    SocketService().joinRoom('${user.role}_${user.id}');
  }
}
