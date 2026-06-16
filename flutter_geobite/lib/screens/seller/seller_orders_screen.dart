import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../theme/glass_theme.dart';
import '../../models/order.dart';
import '../../services/order_service.dart';
import '../../services/rating_service.dart';
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

  void _showRiderRatingDialog(BuildContext context, Order order) {
    int rating = 5;
    final feedbackController = TextEditingController();
    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          return Container(
            padding: EdgeInsets.only(
              left: 24, right: 24, top: 24,
              bottom: MediaQuery.of(context).viewInsets.bottom + 24,
            ),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              border: Border(top: BorderSide(color: Colors.white.withValues(alpha: 0.2))),
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('Rate Rider', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(5, (index) {
                      return IconButton(
                        icon: Icon(
                          index < rating ? Icons.star : Icons.star_border,
                          color: Colors.orange,
                          size: 40,
                        ),
                        onPressed: () => setModalState(() => rating = index + 1),
                      );
                    }),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: feedbackController,
                    maxLines: 3,
                    decoration: InputDecoration(
                      hintText: 'Tell us about the rider\'s service...',
                      filled: true,
                      fillColor: Theme.of(context).brightness == Brightness.dark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.05),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                    ),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: isSubmitting ? null : () async {
                        setModalState(() => isSubmitting = true);
                        try {
                          await ratingService.submitRiderRating(order.id, rating, feedbackController.text);
                          if (mounted) {
                            Navigator.pop(context);
                            GlassToast.success(context, 'Thank you for rating the rider!');
                            _loadOrders();
                          }
                        } catch (e) {
                          setModalState(() => isSubmitting = false);
                          if (mounted) {
                            GlassToast.error(context, e.toString().replaceAll('Exception: Failed to submit rider rating: ', ''));
                          }
                        }
                      },
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: isSubmitting 
                        ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Text('Submit Review', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white)),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
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
                      
                      final showRateRider = order.status == 'delivered' && 
                          order.riderId != null && 
                          !order.riderRatings.any((r) => r.raterRole == 'seller');

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: NeumorphicCard(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              ListTile(
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
                              if (showRateRider) ...[
                                const SizedBox(height: 12),
                                FilledButton.icon(
                                  onPressed: () => _showRiderRatingDialog(context, order),
                                  icon: const Icon(Icons.star, color: Colors.orange, size: 16),
                                  label: const Text('Rate Rider', style: TextStyle(fontWeight: FontWeight.bold)),
                                  style: FilledButton.styleFrom(
                                    backgroundColor: Colors.orange.withValues(alpha: 0.1),
                                    foregroundColor: Colors.orange,
                                    padding: const EdgeInsets.symmetric(vertical: 12),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  ),
                                ),
                              ],
                            ],
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
