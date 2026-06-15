import 'dart:async';
import 'package:flutter/material.dart';
import '../../models/order.dart';
import '../../services/order_service.dart';
import '../../theme/glass_theme.dart';
import 'package:mapcn_flutter/mapcn_flutter.dart';
import 'package:latlong2/latlong.dart';
class OrderDetailScreen extends StatefulWidget {
  final String orderId;

  const OrderDetailScreen({Key? key, required this.orderId}) : super(key: key);

  @override
  _OrderDetailScreenState createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  Order? _order;
  bool _isLoading = true;
  Timer? _timer;

  final List<String> _timeline = [
    'pending',
    'accepted',
    'preparing',
    'ready_for_pickup',
    'picked_up',
    'delivering',
    'delivered'
  ];

  final Map<String, String> _statusLabels = {
    'pending': 'Order Placed',
    'accepted': 'Store Approved',
    'preparing': 'Preparing in Kitchen',
    'ready_for_pickup': 'Ready for Pickup',
    'picked_up': 'Picked up by Rider',
    'delivering': 'On the Way',
    'delivered': 'Delivered',
    'rejected': 'Order Declined',
    'cancelled': 'Order Cancelled',
  };

  @override
  void initState() {
    super.initState();
    _loadOrder();
    _timer = Timer.periodic(const Duration(seconds: 10), (_) => _loadOrder());
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _loadOrder() async {
    try {
      final order = await orderService.getOrder(widget.orderId);
      if (mounted) {
        setState(() {
          _order = order;
          _isLoading = false;
        });
      }
    } catch (e) {
      print('Error loading order: $e');
      if (mounted && _isLoading) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return GlassScaffold(
        appBar: AppBar(backgroundColor: Colors.transparent),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_order == null) {
      return GlassScaffold(
        appBar: AppBar(backgroundColor: Colors.transparent),
        body: const Center(child: Text('Failed to load order.')),
      );
    }

    final displayTimeline = (_order!.status == 'cancelled' || _order!.status == 'rejected')
        ? ['pending', _order!.status]
        : _timeline;

    final currentStep = displayTimeline.indexOf(_order!.status);

    return GlassScaffold(
      appBar: GlassAppBar(
        title: Text('Order Track', style: TextStyle(fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.only(top: 100.0, left: 16.0, right: 16.0, bottom: 16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            SizedBox(
              height: 250,
              width: double.infinity,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: Mapcn(
                  initialCenter: const LatLng(14.5995, 120.9842), // Manila
                  initialZoom: 13,
                  style: Theme.of(context).brightness == Brightness.dark 
                      ? MapcnStyle.midnight 
                      : MapcnStyle.normal,
                  accentColor: AppColors.primary,
                  markerConfig: const MarkerConfig(
                    style: MarkerStyle.pulse,
                    pulseRadius: 35,
                    glowIntensity: 0.8,
                    showShadow: true,
                    coreRadius: 8,
                  ),
                  points: const [
                    LatLng(14.5995, 120.9842), // Mock coordinates
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            NeumorphicCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Order #${_order!.id.substring(0, 8).toUpperCase()}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(_order!.status.toUpperCase().replaceAll('_', ' '), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.primary)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text('Store: ${_order!.vendor?.name ?? 'Local Merchant'}', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6))),
                  Text('Drop-off: ${_order!.deliveryAddress}', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6))),
                  if (_order!.paymentMethod != null)
                    Text('Payment: ${_order!.paymentMethod} • Status: ${_order!.paymentStatus ?? 'pending'}', style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Text('LIVE STATUS', style: TextStyle(fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6), letterSpacing: 1.2, fontSize: 12)),
            const SizedBox(height: 8),
            NeumorphicCard(
              child: Column(
                children: displayTimeline.asMap().entries.map((entry) {
                  final index = entry.key;
                  final step = entry.value;
                  final isCompleted = index <= currentStep;
                  final isCurrent = step == _order!.status;

                  return IntrinsicHeight(
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        SizedBox(
                          width: 32,
                          child: Column(
                            children: [
                              Container(
                                width: isCurrent ? 14 : 12,
                                height: isCurrent ? 14 : 12,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: isCurrent ? Colors.white : (isCompleted ? AppColors.primary : Colors.white),
                                  border: Border.all(color: isCompleted ? AppColors.primary : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.1), width: 2),
                                ),
                                child: isCurrent ? Center(child: Container(width: 6, height: 6, decoration: const BoxDecoration(shape: BoxShape.circle, color: AppColors.primary))) : null,
                              ),
                              if (index < displayTimeline.length - 1)
                                Expanded(
                                  child: Container(
                                    width: 2,
                                    color: isCompleted ? AppColors.primary : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.1),
                                  ),
                                ),
                            ],
                          ),
                        ),
                        Expanded(
                          child: Padding(
                            padding: const EdgeInsets.only(bottom: 24.0, top: 0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _statusLabels[step] ?? step,
                                  style: TextStyle(
                                    fontWeight: isCurrent ? FontWeight.bold : (isCompleted ? FontWeight.w600 : FontWeight.normal),
                                    color: isCurrent ? AppColors.primary : (isCompleted ? Theme.of(context).colorScheme.onSurface : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6)),
                                  ),
                                ),
                                Text(
                                  isCurrent ? 'Active step' : (isCompleted ? 'Passed' : 'Pending'),
                                  style: TextStyle(fontSize: 11, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6)),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 24),
            NeumorphicCard(
              child: Column(
                children: [
                  for (var i = 0; i < _order!.items.length; i++) ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('${_order!.items[i].quantity}x ${_order!.items[i].name}', style: const TextStyle(fontWeight: FontWeight.w600)),
                        Text('₱${(_order!.items[i].price * _order!.items[i].quantity).toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold)),
                      ],
                    ),
                    if (i < _order!.items.length - 1) Divider(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.1), height: 16),
                  ],
                  Divider(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.1), height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Total Charge', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      Text('₱${_order!.totalAmount.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.primary)),
                    ],
                  ),
                ],
              ),
            ),
            if (_order!.notes != null && _order!.notes!.isNotEmpty) ...[
              const SizedBox(height: 16),
              NeumorphicCard(child: Text('"Rider Notes: ${_order!.notes!}"', style: TextStyle(fontStyle: FontStyle.italic, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6)))),
            ],
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}
