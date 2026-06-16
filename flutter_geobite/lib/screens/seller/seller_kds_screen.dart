import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/order.dart';
import '../../services/order_service.dart';
import '../../providers/auth_provider.dart';
import '../../theme/glass_theme.dart';
import '../../widgets/glass_toast.dart';
import '../../services/socket_service.dart';

class SellerKdsScreen extends StatefulWidget {
  const SellerKdsScreen({Key? key}) : super(key: key);

  @override
  _SellerKdsScreenState createState() => _SellerKdsScreenState();
}

class _SellerKdsScreenState extends State<SellerKdsScreen> {
  List<Order> _orders = [];
  bool _isLoading = true;
  StreamSubscription? _orderSub;
  StreamSubscription? _newOrderSub;

  @override
  void initState() {
    super.initState();
    _loadOrders();

    _orderSub = SocketService().orderStatusStream.listen((data) {
      _loadOrders(silent: true);
    });

    _newOrderSub = SocketService().newOrderStream.listen((data) {
      if (mounted) {
        GlassToast.success(context, 'New Order for Kitchen!');
        _loadOrders(silent: true);
      }
    });
  }

  @override
  void dispose() {
    _orderSub?.cancel();
    _newOrderSub?.cancel();
    super.dispose();
  }

  Future<void> _loadOrders({bool silent = false}) async {
    if (!silent) setState(() => _isLoading = true);
    try {
      final orders = await orderService.getOrders();
      if (mounted) {
        setState(() {
          _orders = orders;
          _isLoading = false;
        });
      }
    } catch (e) {
      print('Error loading KDS orders: $e');
      if (mounted && !silent) setState(() => _isLoading = false);
    }
  }

  Future<void> _updateStatus(String orderId, String newStatus) async {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      _loadOrders(silent: true);
      if (mounted) GlassToast.success(context, 'Order updated to $newStatus');
    } catch (e) {
      if (mounted) GlassToast.error(context, 'Failed to update order');
    }
  }

  @override
  Widget build(BuildContext context) {
    // Filter orders by status
    final pendingOrders = _orders.where((o) => o.status == 'pending' || o.status == 'accepted').toList();
    final preparingOrders = _orders.where((o) => o.status == 'preparing').toList();
    final readyOrders = _orders.where((o) => o.status == 'ready_for_pickup').toList();

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: GlassAppBar(
        title: const Text('Kitchen Display', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => _loadOrders(),
          ),
        ],
      ),
      body: _isLoading && _orders.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () => _loadOrders(),
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16.0, 16.0, 16.0, 100.0),
                children: [
                  _buildBentoRow('To Cook', pendingOrders, Colors.orange),
                  const SizedBox(height: 16),
                  _buildBentoRow('Cooking', preparingOrders, Colors.blue),
                  const SizedBox(height: 16),
                  _buildBentoRow('Ready', readyOrders, Colors.green),
                ],
              ),
            ),
    );
  }

  Widget _buildBentoRow(String title, List<Order> columnOrders, Color headerColor) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(12.0),
            child: Row(
              children: [
                Icon(Icons.circle, color: headerColor, size: 12),
                const SizedBox(width: 8),
                Text(
                  '$title (${columnOrders.length})',
                  style: TextStyle(fontWeight: FontWeight.bold, color: headerColor, fontSize: 16),
                ),
              ],
            ),
          ),
          if (columnOrders.isEmpty)
            const Padding(
              padding: EdgeInsets.all(24.0),
              child: Center(child: Text('No orders in this queue', style: TextStyle(color: Colors.grey))),
            )
          else
            SizedBox(
              height: 220, // Fixed height for horizontal scrolling cards
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                itemCount: columnOrders.length,
                itemBuilder: (context, index) {
                  return Container(
                    width: 260, // Bento scaled down width
                    margin: const EdgeInsets.only(right: 12, bottom: 12),
                    child: _buildOrderTicket(columnOrders[index]),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildOrderTicket(Order order) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 4, offset: const Offset(0, 2)),
        ],
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('#${order.id.substring(0, 6).toUpperCase()}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
              Text(
                '${DateTime.parse(order.createdAt).toLocal().hour}:${DateTime.parse(order.createdAt).toLocal().minute.toString().padLeft(2, '0')}',
                style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6)),
              ),
            ],
          ),
          const Divider(),
          // Note: Assuming items is a List of map or dynamic in the Order model if available, otherwise just show customer.
          // Since Order model might not have full item details exposed in current definition, we'll just show basics for now.
          Text('Customer: ${order.customer?.name ?? 'Walk-in'}', style: const TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const Text('Items:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
          // Placeholder for items if the backend returns them
          const Text('- Full Order Details', style: TextStyle(fontSize: 14)),
          const SizedBox(height: 16),
          if (order.status == 'accepted' || order.status == 'pending')
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                style: FilledButton.styleFrom(backgroundColor: Colors.blue),
                onPressed: () => _updateStatus(order.id, 'preparing'),
                child: const Text('Start Cooking'),
              ),
            )
          else if (order.status == 'preparing')
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                style: FilledButton.styleFrom(backgroundColor: Colors.green),
                onPressed: () => _updateStatus(order.id, 'ready_for_pickup'),
                child: const Text('Mark Ready'),
              ),
            )
          else if (order.status == 'ready_for_pickup')
             SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () {}, // Handled by dashboard/rider
                child: const Text('Waiting for Rider/Customer'),
              ),
            ),
        ],
      ),
    );
  }
}
