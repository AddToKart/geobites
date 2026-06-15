import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:mapcn_flutter/mapcn_flutter.dart';
import 'package:latlong2/latlong.dart';
import '../../models/order.dart';
import '../../services/order_service.dart';
import '../../theme/glass_theme.dart';
import '../../widgets/glass_toast.dart';

class RiderAcceptTaskScreen extends StatefulWidget {
  final Order order;

  const RiderAcceptTaskScreen({Key? key, required this.order}) : super(key: key);

  @override
  _RiderAcceptTaskScreenState createState() => _RiderAcceptTaskScreenState();
}

class _RiderAcceptTaskScreenState extends State<RiderAcceptTaskScreen> {
  bool _isAccepting = false;
  List<LatLng> _routePoints = [];

  @override
  void initState() {
    super.initState();
    _loadRoute();
  }

  void _loadRoute() {
    final vendorLat = widget.order.vendor?.latitude ?? 14.8214;
    final vendorLng = widget.order.vendor?.longitude ?? 120.9565;
    final vendorLoc = LatLng(vendorLat, vendorLng);

    final deliveryLat = widget.order.deliveryLat ?? vendorLat + 0.01;
    final deliveryLng = widget.order.deliveryLng ?? vendorLng + 0.01;
    final deliveryLoc = LatLng(deliveryLat, deliveryLng);
    
    _fetchRoute(vendorLoc, deliveryLoc);
  }

  Future<void> _fetchRoute(LatLng start, LatLng end) async {
    try {
      final url = Uri.parse('http://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?geometries=geojson');
      final response = await http.get(url);
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final coords = data['routes'][0]['geometry']['coordinates'] as List;
        final points = coords.map((c) => LatLng(c[1] as double, c[0] as double)).toList();
        if (mounted) {
          setState(() {
            _routePoints = points;
          });
        }
      } else {
        if (mounted) setState(() => _routePoints = [start, end]);
      }
    } catch (e) {
      if (mounted) setState(() => _routePoints = [start, end]);
    }
  }

  Future<void> _acceptTask() async {
    setState(() => _isAccepting = true);
    try {
      if (widget.order.id.startsWith('mock-')) {
        await Future.delayed(const Duration(seconds: 1));
      } else {
        await orderService.updateOrderStatus(widget.order.id, 'ready_for_pickup');
      }
      if (mounted) {
        Navigator.pop(context, true); // true indicates successful acceptance
      }
    } catch (e) {
      if (mounted) {
        GlassToast.error(context, 'Failed to accept task: $e');
        setState(() => _isAccepting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Determine vendor location (fallback to generic if null)
    final vendorLat = widget.order.vendor?.latitude ?? 14.8214;
    final vendorLng = widget.order.vendor?.longitude ?? 120.9565;
    final vendorLoc = LatLng(vendorLat, vendorLng);

    // Determine delivery location
    final deliveryLat = widget.order.deliveryLat ?? vendorLat + 0.01;
    final deliveryLng = widget.order.deliveryLng ?? vendorLng + 0.01;
    final deliveryLoc = LatLng(deliveryLat, deliveryLng);

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(
        title: const Text('Order Details', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Column(
        children: [
          // Map Header showing Pickup and Dropoff
          Expanded(
            flex: 2,
            child: Mapcn(
              initialCenter: vendorLoc,
              initialZoom: 13,
              style: Theme.of(context).brightness == Brightness.dark ? MapcnStyle.midnight : MapcnStyle.silver,
              points: [vendorLoc, deliveryLoc],
              routes: [
                MapcnRoute(
                  points: _routePoints.isEmpty ? [vendorLoc, deliveryLoc] : _routePoints,
                  config: RouteConfig.liveTracking,
                ),
              ],
              markerConfig: const MarkerConfig(
                style: MarkerStyle.pulse,
                pulseRadius: 30,
              ),
            ),
          ),
          // Details Card
          Expanded(
            flex: 3,
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 10, offset: const Offset(0, -5)),
                ],
              ),
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text('Order #${widget.order.id.substring(0, 8).toUpperCase()}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),
                    _buildInfoRow(context, Icons.storefront, 'Pickup At', widget.order.vendor?.name ?? 'Store'),
                    const SizedBox(height: 12),
                    _buildInfoRow(context, Icons.location_on, 'Deliver To', widget.order.deliveryAddress),
                    if (widget.order.notes != null && widget.order.notes!.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      _buildInfoRow(context, Icons.note, 'Notes', widget.order.notes!),
                    ],
                    const SizedBox(height: 16),
                    const Divider(),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Items to Deliver', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        Text('₱${widget.order.totalAmount.toStringAsFixed(2)}', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.primary)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ...widget.order.items.map((item) => Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Text('• ${item.quantity}x ${item.name}', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7))),
                        )),
                    const SizedBox(height: 32),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: _isAccepting ? null : () => Navigator.pop(context),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.red,
                              side: const BorderSide(color: Colors.red),
                              padding: const EdgeInsets.symmetric(vertical: 16),
                            ),
                            child: const Text('DECLINE'),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: FilledButton(
                            onPressed: _isAccepting ? null : _acceptTask,
                            style: FilledButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                            ),
                            child: _isAccepting
                                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                : const Text('ACCEPT TASK', style: TextStyle(fontWeight: FontWeight.bold)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(BuildContext context, IconData icon, String title, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
          child: Icon(icon, color: AppColors.primary),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5), fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            ],
          ),
        ),
      ],
    );
  }
}
