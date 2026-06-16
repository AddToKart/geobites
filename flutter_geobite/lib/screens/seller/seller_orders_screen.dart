import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../theme/glass_theme.dart';
import '../../models/order.dart';
import '../../services/order_service.dart';
import '../../widgets/receipt_widget.dart';
import '../../widgets/glass_toast.dart';
import '../../widgets/animated_tap_card.dart';
import '../../widgets/pagination_controls.dart';

class SellerOrdersScreen extends StatefulWidget {
  const SellerOrdersScreen({Key? key}) : super(key: key);

  @override
  _SellerOrdersScreenState createState() => _SellerOrdersScreenState();
}

class _SellerOrdersScreenState extends State<SellerOrdersScreen> {
  List<Order> _orders = [];
  bool _isLoading = true;
  int _currentPage = 0;
  static const int _itemsPerPage = 5;

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  Future<void> _loadOrders() async {
    setState(() => _isLoading = true);
    try {
      final orders = await orderService.getOrders();
      // Optionally sort by newest first
      orders.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      setState(() {
        _orders = orders;
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading orders history: $e');
      setState(() => _isLoading = false);
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
                          // Print logic would go here
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
      appBar: GlassAppBar(
        title: Text('Orders & Receipts', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 24, color: Theme.of(context).colorScheme.onSurface)),
        automaticallyImplyLeading: false,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _orders.isEmpty
              ? const Center(child: Text('No orders found.'))
              : Builder(
                  builder: (context) {
                    final int totalPages = (_orders.length / _itemsPerPage).ceil();
                    final paginatedOrders = _orders.skip(_currentPage * _itemsPerPage).take(_itemsPerPage).toList();

                    return Column(
                      children: [
                        Expanded(
                          child: RefreshIndicator(
                            onRefresh: _loadOrders,
                            child: ListView.builder(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                              itemCount: paginatedOrders.length,
                              itemBuilder: (context, index) {
                                final order = paginatedOrders[index];
                      DateTime date;
                      try {
                        date = DateTime.parse(order.createdAt);
                      } catch (e) {
                        date = DateTime.now();
                      }
                      
                      final isPOS = order.deliveryAddress.toLowerCase() == 'pos' || order.deliveryAddress.toLowerCase() == 'dine-in' || order.deliveryAddress.toLowerCase() == 'takeout';
                      
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: NeumorphicCard(
                          child: ListTile(
                            contentPadding: EdgeInsets.zero,
                          leading: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: isPOS ? AppColors.primary.withValues(alpha: 0.1) : Colors.blue.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(
                              isPOS ? Icons.point_of_sale : Icons.delivery_dining,
                              color: isPOS ? AppColors.primary : Colors.blue,
                            ),
                          ),
                          title: Text(
                            'Order #${order.id.substring(0, 8).toUpperCase()}',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(DateFormat('MMM d, yyyy h:mm a').format(date)),
                              Text('${order.status} • ₱${order.totalAmount.toStringAsFixed(2)}'),
                            ],
                          ),
                          trailing: FilledButton.icon(
                            onPressed: () => _showReceipt(order),
                            icon: const Icon(Icons.receipt_long, size: 16),
                            label: const Text('Receipt'),
                            style: FilledButton.styleFrom(
                              backgroundColor: Theme.of(context).brightness == Brightness.dark ? Colors.white24 : Colors.black12,
                              foregroundColor: Theme.of(context).colorScheme.onSurface,
                            ),
                          ),
                        ),
                      ),
                    );

                  },
                ),
              ),
            ),
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
