import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/order.dart';
import '../../services/order_service.dart';
import '../../providers/auth_provider.dart';
import '../../theme/glass_theme.dart';
import '../../widgets/receipt_widget.dart';
import '../../widgets/glass_toast.dart';

class SellerDashboardScreen extends StatefulWidget {
  const SellerDashboardScreen({Key? key}) : super(key: key);

  @override
  _SellerDashboardScreenState createState() => _SellerDashboardScreenState();
}

class _SellerDashboardScreenState extends State<SellerDashboardScreen> {
  List<Order> _orders = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadOrders();
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
          Stack(
            alignment: Alignment.center,
            children: [
              IconButton(
                icon: Icon(Icons.notifications_none, color: Theme.of(context).colorScheme.onSurface),
                onPressed: () => GlassToast.info(context, 'You have 3 new notifications'),
              ),
              Positioned(
                right: 8,
                top: 8,
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                  child: const Text('3', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
          IconButton(
            icon: Icon(Icons.logout, color: Theme.of(context).colorScheme.onSurface),
            onPressed: () => Provider.of<AuthProvider>(context, listen: false).signOut(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadOrders,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _orders.isEmpty
                ? const Center(child: Text('No orders yet.'))
                : ListView.builder(
                    padding: const EdgeInsets.only(top: 16.0, left: 16.0, right: 16.0, bottom: 100.0),
                    itemCount: _orders.length,
                    itemBuilder: (context, index) {
                      final order = _orders[index];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16.0),
                        child: NeumorphicCard(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text('Order #${order.id.substring(0, 8).toUpperCase()}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
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
    );
  }
}
