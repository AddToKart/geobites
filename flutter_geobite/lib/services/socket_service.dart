import 'dart:async';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../core/api_client.dart';
import 'sync_service.dart';

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  IO.Socket? _socket;
  final _orderStatusController = StreamController<Map<String, dynamic>>.broadcast();
  final _riderLocationController = StreamController<Map<String, dynamic>>.broadcast();
  final _newOrderController = StreamController<Map<String, dynamic>>.broadcast();
  final _notificationController = StreamController<Map<String, dynamic>>.broadcast();
  final _connectionStateController = StreamController<bool>.broadcast();

  Stream<Map<String, dynamic>> get orderStatusStream => _orderStatusController.stream;
  Stream<Map<String, dynamic>> get riderLocationStream => _riderLocationController.stream;
  Stream<Map<String, dynamic>> get newOrderStream => _newOrderController.stream;
  Stream<Map<String, dynamic>> get notificationStream => _notificationController.stream;
  Stream<bool> get connectionStateStream => _connectionStateController.stream;

  bool get isConnected => _socket?.connected ?? false;

  Future<void> connect() async {
    if (_socket != null && _socket!.connected) return;

    // Read stored session token to authenticate the WebSocket connection
    const storage = FlutterSecureStorage();
    final token = await storage.read(key: 'jwt_token');

    // Use the shared socketUrl from ApiClient so we always hit the right server
    final socketUrl = ApiClient.socketUrl;

    _socket = IO.io(
      socketUrl,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .setExtraHeaders(
            token != null
                ? {
                    'Authorization': 'Bearer $token',
                    'Cookie': 'better-auth.session_token=$token',
                  }
                : {},
          )
          .build(),
    );

    _socket!.connect();

    _socket!.onConnect((_) {
      print('Socket.IO connected to $socketUrl');
      _connectionStateController.add(true);
      // Flush any offline-queued actions now that we have connectivity
      SyncService().syncPendingActions();
    });

    _socket!.onDisconnect((_) {
      print('Socket.IO disconnected');
      _connectionStateController.add(false);
    });

    _socket!.on('order_status_updated', (data) {
      print('Socket: order_status_updated -> $data');
      _orderStatusController.add(Map<String, dynamic>.from(data));
    });

    _socket!.on('rider_location_updated', (data) {
      print('Socket: rider_location_updated -> $data');
      _riderLocationController.add(Map<String, dynamic>.from(data));
    });

    _socket!.on('new_order', (data) {
      print('Socket: new_order -> $data');
      _newOrderController.add(Map<String, dynamic>.from(data));
    });

    _socket!.on('notification', (data) {
      print('Socket: notification -> $data');
      _notificationController.add(Map<String, dynamic>.from(data));
    });
  }

  void joinRoom(String room) {
    if (_socket != null && _socket!.connected) {
      _socket!.emit('join_room', room);
    }
  }

  void leaveRoom(String room) {
    if (_socket != null && _socket!.connected) {
      _socket!.emit('leave_room', room);
    }
  }

  void emitRiderLocation(String orderId, double lat, double lng) {
    if (_socket != null && _socket!.connected) {
      _socket!.emit('update_rider_location', {
        'orderId': orderId,
        'lat': lat,
        'lng': lng,
      });
    }
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }
}

