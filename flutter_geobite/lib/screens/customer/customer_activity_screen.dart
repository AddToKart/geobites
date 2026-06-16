import 'package:flutter/material.dart';
import '../../models/order.dart';
import '../../services/order_service.dart';
import '../../theme/glass_theme.dart';
import 'order_detail_screen.dart';
import '../../widgets/animated_tap_card.dart';
import '../../widgets/pagination_controls.dart';

class CustomerActivityScreen extends StatefulWidget {
  const CustomerActivityScreen({Key? key}) : super(key: key);

  @override
  _CustomerActivityScreenState createState() => _CustomerActivityScreenState();
}

class _CustomerActivityScreenState extends State<CustomerActivityScreen> {
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
      final orders = await orderService.getOrders(); // Backend should return user's orders
      setState(() {
        _orders = orders;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: GlassAppBar(
        title: Text('Activity', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 24, color: Theme.of(context).colorScheme.onSurface)),
        automaticallyImplyLeading: false,
      ),
      body: RefreshIndicator(
        onRefresh: _loadOrders,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _orders.isEmpty
                ? const Center(child: Text('No orders yet.', style: TextStyle(fontSize: 18)))
                : Builder(
                    builder: (context) {
                      final int totalPages = (_orders.length / _itemsPerPage).ceil();
                      final paginatedOrders = _orders.skip(_currentPage * _itemsPerPage).take(_itemsPerPage).toList();

                      return Column(
                        children: [
                          Expanded(
                            child: ListView.builder(
                              padding: const EdgeInsets.only(top: 100.0, left: 16.0, right: 16.0, bottom: 32.0),
                              itemCount: paginatedOrders.length,
                              itemBuilder: (context, index) {
                                final order = paginatedOrders[index];
                                final isActive = order.status != 'delivered' && order.status != 'rejected';
                                
                                return Padding(
                                  padding: const EdgeInsets.only(bottom: 16.0),
                                  child: AnimatedTapCard(
                                    onTap: () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: order.id)),
                                      ).then((_) => _loadOrders());
                                    },
                                    child: NeumorphicCard(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            children: [
                                              Expanded(
                                                child: Text(
                                                  order.vendor?.name ?? 'Restaurant',
                                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                                                ),
                                              ),
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                                decoration: BoxDecoration(
                                                  color: isActive ? AppColors.primary.withValues(alpha: 0.2) : Colors.grey.withValues(alpha: 0.2),
                                                  borderRadius: BorderRadius.circular(kSharpRadius),
                                                ),
                                                child: Text(
                                                  order.status.toUpperCase(),
                                                  style: TextStyle(
                                                    fontSize: 12,
                                                    fontWeight: FontWeight.bold,
                                                    color: isActive ? AppColors.primary : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 12),
                                          Text(
                                            'Order #${order.id.substring(0, 8).toUpperCase()}',
                                            style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6), fontSize: 14),
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            'Total: ₱${order.totalAmount.toStringAsFixed(2)}',
                                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                );
                              },
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
      ),
    );
  }
}
