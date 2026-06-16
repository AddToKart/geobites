import 'dart:async';
import 'package:flutter/material.dart';
import '../services/notification_service.dart';
import '../services/socket_service.dart';

class NotificationProvider with ChangeNotifier {
  List<Map<String, dynamic>> _notifications = [];
  bool _isLoading = false;
  StreamSubscription? _socketSubscription;

  List<Map<String, dynamic>> get notifications => _notifications;
  bool get isLoading => _isLoading;
  int get unreadCount => _notifications.where((n) => !(n['isRead'] as bool? ?? false)).length;

  void initialize(String userId, {void Function(Map<String, dynamic>)? onNotificationReceived}) {
    // Cancel any existing subscription
    _socketSubscription?.cancel();
    
    // Load notifications from the backend API
    loadNotifications();

    // Listen to real-time notification stream from socket
    _socketSubscription = SocketService().notificationStream.listen((data) {
      print('NotificationProvider: Received real-time socket notification -> $data');
      
      // Check if this notification is already in the list
      final exists = _notifications.any((n) => n['id'] == data['id']);
      if (!exists) {
        // Since we got a new notification, insert at the beginning of the list
        // and trigger notification callback (e.g. for displaying in-app toast)
        _notifications.insert(0, data);
        notifyListeners();
        
        if (onNotificationReceived != null) {
          onNotificationReceived(data);
        }
      }
    });
  }

  void stop() {
    _socketSubscription?.cancel();
    _socketSubscription = null;
    _notifications = [];
    notifyListeners();
  }

  Future<void> loadNotifications() async {
    _isLoading = true;
    notifyListeners();
    try {
      final list = await notificationService.getNotifications();
      _notifications = list;
    } catch (e) {
      print('NotificationProvider: Error loading notifications -> $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> markAsRead(String id) async {
    try {
      await notificationService.markAsRead(id);
      final index = _notifications.indexWhere((n) => n['id'] == id);
      if (index != -1) {
        _notifications[index]['isRead'] = true;
        notifyListeners();
      }
    } catch (e) {
      print('NotificationProvider: Error marking notification as read -> $e');
    }
  }

  Future<void> markAllAsRead() async {
    try {
      await notificationService.markAllAsRead();
      for (var n in _notifications) {
        n['isRead'] = true;
      }
      notifyListeners();
    } catch (e) {
      print('NotificationProvider: Error marking all notifications as read -> $e');
    }
  }

  void clearLocal() {
    _notifications = [];
    notifyListeners();
  }
}
