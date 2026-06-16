import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/order.dart';
import '../../services/order_service.dart';
import '../../providers/auth_provider.dart';
import '../../theme/glass_theme.dart';
import '../../widgets/animated_tap_card.dart';
import '../../widgets/pagination_controls.dart';
import '../../widgets/receipt_widget.dart';
import '../../widgets/glass_toast.dart';
import 'dart:async';
import '../../services/socket_service.dart';
import '../../providers/notification_provider.dart';
import '../../main.dart';
import '../../providers/notification_provider.dart';
import '../../main.dart';

class SellerDashboardScreen extends StatefulWidget {
  const SellerDashboardScreen({Key? key}) : super(key: key);

  @override
  _SellerDashboardScreenState createState() => _SellerDashboardScreenState();
}

class _SellerDashboardScreenState extends State<SellerDashboardScreen> {
  List<Order> _orders = [];
  bool _isLoading = true;
  int _currentPage = 0;
  static const int _itemsPerPage = 5;
  StreamSubscription? _orderSub;
  StreamSubscription? _newOrderSub;

  @override
  void initState() {
    super.initState();
    _loadOrders();

    _orderSub = SocketService().orderStatusStream.listen((data) {
      // Refresh if the status of any of our orders changes
      _loadOrders();
    });

    _newOrderSub = SocketService().newOrderStream.listen((data) {
      if (mounted) {
        GlassToast.success(context, 'New Order Received!');
        _loadOrders();
      }
    });
  }

  @override
  void dispose() {
    _orderSub?.cancel();
    _newOrderSub?.cancel();
    super.dispose();
  }

  Future<void> _loadOrders() async {
    setState(() => _isLoading = true);
    try {
      final orders = await orderService.getOrders(); // Backend should filter by vendorId based on session
      setState(() {
        _orders = orders;
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading seller orders: $e');
      setState(() => _isLoading = false);
    }
  }

  Future<void> _updateStatus(String orderId, String newStatus) async {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      _loadOrders();
      
      // Simulate Cross-App Notification
      if (newStatus == 'accepted') {
        GlassToast.success(context, 'Order accepted! Notification sent to Customer.');
      } else if (newStatus == 'ready_for_pickup') {
        GlassToast.success(context, 'Order ready! Notification sent to Rider & Customer.');
      } else {
        GlassToast.info(context, 'Order updated to $newStatus');
      }
    } catch (e) {
      print('Error updating status: $e');
      GlassToast.error(context, 'Failed to update status');
    }
  }

  void _showReceipt(Order order) {
    showDialog(
      context: context,
      builder: (context) {
        return Dialog(
          backgroundColor: Colors.transparent,
          insetPadding: const EdgeInsets.all(16),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 400),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  ReceiptWidget(order: order),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      ElevatedButton.icon(
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(Icons.close),
                        label: const Text('Close'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: Colors.black,
                        ),
                      ),
                      ElevatedButton.icon(
                        onPressed: () {
                          GlassToast.info(context, 'Printing Receipt...');
                          Navigator.pop(context);
                        },
                        icon: const Icon(Icons.print),
                        label: const Text('Print'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: Text('Live Orders', style: TextStyle(fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface)),
        actions: [
          Consumer<NotificationProvider>(
            builder: (context, notificationProvider, _) {
              final unreadCount = notificationProvider.unreadCount;
              final notifications = notificationProvider.notifications;
              
              return Stack(
                clipBehavior: Clip.none,
                children: [
                  PopupMenuButton<String>(
                    icon: Icon(Icons.notifications_none, color: Theme.of(context).colorScheme.onSurface, size: 24),
                    padding: EdgeInsets.zero,
                    offset: const Offset(0, 40),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    color: Theme.of(context).colorScheme.surface,
                    onSelected: (value) {
                      if (value == 'read_all') {
                        notificationProvider.markAllAsRead();
                        GlassToast.success(context, 'All marked as read');
                      } else if (value == 'clear') {
                        notificationProvider.clearLocal();
                        GlassToast.info(context, 'Notifications cleared');
                      } else {
                        notificationProvider.markAsRead(value);
                      }
                    },
                    itemBuilder: (BuildContext context) {
                      final List<PopupMenuEntry<String>> items = [];
                      
                      if (notifications.isEmpty) {
                        items.add(
                          const PopupMenuItem<String>(
                            enabled: false,
                            child: Text('No notifications', style: TextStyle(color: Colors.grey)),
                          ),
                        );
                      } else {
                        for (var notification in notifications.take(5)) {
                          final isRead = notification['isRead'] as bool? ?? false;
                          items.add(
                            PopupMenuItem<String>(
                              value: notification['id'],
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      if (!isRead)
                                        Container(
                                          margin: const EdgeInsets.only(right: 6),
                                          width: 6,
                                          height: 6,
                                          decoration: const BoxDecoration(
                                            color: AppColors.primary,
                                            shape: BoxShape.circle,
                                          ),
                                        ),
                                      Expanded(
                                        child: Text(
                                          notification['title'] ?? 'Notification',
                                          style: TextStyle(
                                            fontWeight: isRead ? FontWeight.normal : FontWeight.bold,
                                            fontSize: 13,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    notification['message'] ?? '',
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                          items.add(const PopupMenuDivider());
                        }
                      }
                      
                      items.addAll([
                        const PopupMenuItem<String>(
                          value: 'read_all',
                          child: Row(
                            children: [
                              Icon(Icons.checklist, size: 18),
                              SizedBox(width: 8),
                              Text('Mark all as read'),
                            ],
                          ),
                        ),
                        const PopupMenuItem<String>(
                          value: 'clear',
                          child: Row(
                            children: [
                              Icon(Icons.delete_outline, size: 18, color: Colors.red),
                              SizedBox(width: 8),
                              Text('Remove all notifications', style: TextStyle(color: Colors.red)),
                            ],
                          ),
                        ),
                      ]);
                      
                      return items;
                    },
                  ),
                  if (unreadCount > 0)
                    Positioned(
                      top: 4,
                      right: 4,
                      child: Container(
                        padding: const EdgeInsets.all(2),
                        decoration: const BoxDecoration(
                          color: Colors.red,
                          shape: BoxShape.circle,
                        ),
                        constraints: const BoxConstraints(
                          minWidth: 14,
                          minHeight: 14,
                        ),
                        child: Text(
                          '$unreadCount',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 8,
                            fontWeight: FontWeight.bold,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                ],
              );
            },
          ),
          IconButton(
            icon: Icon(Icons.logout, color: Theme.of(context).colorScheme.onSurface),
            onPressed: () async {
              Provider.of<NotificationProvider>(context, listen: false).stop();
              await Provider.of<AuthProvider>(context, listen: false).signOut();
              if (context.mounted) {
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const AuthWrapper()),
                  (route) => false,
                );
              }
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Builder(
              builder: (context) {
                final user = Provider.of<AuthProvider>(context).user;
                final todayOrders = _orders.where((o) {
                  try {
                    return DateTime.parse(o.createdAt).toLocal().day == DateTime.now().day;
                  } catch (e) { return false; }
                }).toList();
                final todayRevenue = todayOrders.fold<double>(0.0, (sum, order) => sum + order.totalAmount);
                final activeOrders = _orders.where((o) => o.status == 'pending' || o.status == 'accepted' || o.status == 'preparing').length;

                final int totalPages = (_orders.length / _itemsPerPage).ceil();
                final paginatedOrders = _orders.skip(_currentPage * _itemsPerPage).take(_itemsPerPage).toList();

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Greeting Header
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                      child: Text(
                        'Hello, ${user?.name ?? 'Seller'}! 👋',
                        style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                      ),
                    ),
                    
                    // Analytics Summary
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0),
                      child: Row(
                        children: [
                          Expanded(
                            child: NeumorphicCard(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Today\'s Revenue', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7), fontSize: 12)),
                                  const SizedBox(height: 4),
                                  Text('₱${todayRevenue.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.primary)),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: NeumorphicCard(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Active Orders', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7), fontSize: 12)),
                                  const SizedBox(height: 4),
                                  Text('$activeOrders', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.blue)),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    // Orders List
                    Expanded(
                      child: RefreshIndicator(
                        onRefresh: _loadOrders,
                        child: paginatedOrders.isEmpty
                            ? const Center(child: Text('No orders yet.'))
                            : ListView.builder(
                                padding: const EdgeInsets.only(top: 8.0, left: 16.0, right: 16.0, bottom: 16.0),
                                itemCount: paginatedOrders.length,
                                itemBuilder: (context, index) {
                                    final order = paginatedOrders[index];
                                    final isPickup = order.orderType == 'PICKUP' || order.notes == 'POS Walk-in Order' || order.deliveryAddress == 'No address provided';
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16.0),
                        child: NeumorphicCard(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Wrap(
                                      crossAxisAlignment: WrapCrossAlignment.center,
                                      spacing: 8,
                                      children: [
                                        Text('Order #${order.id.substring(0, 8).toUpperCase()}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: isPickup ? Colors.orange.withValues(alpha: 0.1) : Colors.blue.withValues(alpha: 0.1),
                                            borderRadius: BorderRadius.circular(4),
                                            border: Border.all(color: isPickup ? Colors.orange.withValues(alpha: 0.3) : Colors.blue.withValues(alpha: 0.3)),
                                          ),
                                          child: Text(
                                            isPickup ? 'To Pickup' : 'Delivery',
                                            style: TextStyle(
                                              fontSize: 10,
                                              fontWeight: FontWeight.bold,
                                              color: isPickup ? Colors.orange : Colors.blue,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                                    child: Text(order.status.toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.primaryDark)),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text('Customer: ${order.customer?.name ?? 'Unknown'}', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6))),
                              Text('Total: ₱${order.totalAmount.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold)),
                              const SizedBox(height: 12),
                              if (order.status == 'pending')
                                Row(
                                  children: [
                                    Expanded(
                                      child: OutlinedButton(
                                        onPressed: () => _updateStatus(order.id, 'rejected'),
                                        style: OutlinedButton.styleFrom(foregroundColor: Colors.red),
                                        child: const Text('Reject'),
                                      ),
                                    ),
                                    const SizedBox(width: 16),
                                    Expanded(
                                      child: FilledButton(
                                        onPressed: () => _updateStatus(order.id, 'accepted'),
                                        child: const Text('Accept'),
                                      ),
                                    ),
                                  ],
                                )
                              else if (order.status == 'accepted')
                                SizedBox(
                                  width: double.infinity,
                                  child: FilledButton(
                                    onPressed: () => _updateStatus(order.id, 'preparing'),
                                    child: const Text('Start Preparing'),
                                  ),
                                )
                              else if (order.status == 'preparing')
                                SizedBox(
                                  width: double.infinity,
                                  child: FilledButton(
                                    onPressed: () => _updateStatus(order.id, 'ready_for_pickup'),
                                    child: const Text('Mark Ready for Pickup'),
                                  ),
                                )
                              else if (order.status == 'ready_for_pickup' && isPickup)
                                SizedBox(
                                  width: double.infinity,
                                  child: FilledButton(
                                    onPressed: () => _updateStatus(order.id, 'delivered'),
                                    child: const Text('Complete Pickup'),
                                  ),
                                ),
                              const SizedBox(height: 8),
                              SizedBox(
                                width: double.infinity,
                                child: OutlinedButton.icon(
                                  onPressed: () => _showReceipt(order),
                                  icon: const Icon(Icons.receipt_long, size: 16),
                                  label: const Text('View Receipt'),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),
              if (totalPages > 1)
                PaginationControls(
                  currentPage: _currentPage,
                  totalPages: totalPages,
                  onPageChanged: (page) => setState(() => _currentPage = page),
                ),
            ],
          );
        },
      ),
    );
  }
}
