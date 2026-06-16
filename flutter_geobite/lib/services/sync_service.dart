import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../database/database_helper.dart';
import '../core/api_client.dart';

class SyncService {
  static final SyncService _instance = SyncService._internal();
  factory SyncService() => _instance;
  SyncService._internal();

  bool _isSyncing = false;

  Future<void> syncPendingActions() async {
    if (_isSyncing) return;
    _isSyncing = true;

    try {
      final pendingActions = await DatabaseHelper.instance.getPendingActions();
      
      for (var action in pendingActions) {
        final id = action['id'] as String;
        final actionType = action['actionType'] as String;
        final payloadStr = action['payload'] as String;
        final payload = jsonDecode(payloadStr);

        try {
          if (actionType == 'PLACE_ORDER') {
            await apiClient.dio.post('/orders', data: payload);
          } else if (actionType == 'UPDATE_STATUS') {
            final orderId = payload['orderId'];
            final status = payload['status'];
            await apiClient.dio.patch('/orders/$orderId/status', data: {'status': status});
          }

          // If successful, remove from queue
          await DatabaseHelper.instance.removeAction(id);
          print('Successfully synced action: $actionType');
        } catch (e) {
          print('Failed to sync action $actionType: $e');
          // We break to maintain queue order, wait for next connection
          break;
        }
      }
    } catch (e) {
      print('Sync service error: $e');
    } finally {
      _isSyncing = false;
    }
  }
}
