import '../core/api_client.dart';

class NotificationService {
  /// Get all notifications for the current user
  Future<List<Map<String, dynamic>>> getNotifications() async {
    try {
      final response = await apiClient.dio.get('/notifications');
      final data = response.data;
      final List list = data is Map ? (data['data'] ?? []) : data;
      return list.cast<Map<String, dynamic>>();
    } catch (e) {
      throw Exception('Failed to load notifications: $e');
    }
  }

  /// Get unread notification count
  Future<int> getUnreadCount() async {
    try {
      final response = await apiClient.dio.get('/notifications/unread-count');
      final data = response.data;
      if (data is Map) return (data['count'] as num?)?.toInt() ?? 0;
      return 0;
    } catch (e) {
      return 0;
    }
  }

  /// Mark a specific notification as read
  Future<void> markAsRead(String id) async {
    try {
      await apiClient.dio.patch('/notifications/$id/read');
    } catch (e) {
      throw Exception('Failed to mark notification as read: $e');
    }
  }

  /// Mark all notifications as read
  Future<void> markAllAsRead() async {
    try {
      await apiClient.dio.patch('/notifications/read-all');
    } catch (e) {
      throw Exception('Failed to mark all notifications as read: $e');
    }
  }
}

final notificationService = NotificationService();
