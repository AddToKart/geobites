import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:mapcn_flutter/mapcn_flutter.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../providers/cart_provider.dart';
import '../../services/order_service.dart';
import '../../providers/auth_provider.dart';
import '../../theme/glass_theme.dart';
import 'order_detail_screen.dart';
import 'map_selection_screen.dart';
import '../../widgets/glass_toast.dart';

class CartScreen extends StatefulWidget {
  @override
  _CartScreenState createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> with TickerProviderStateMixin {
  final _addressController = TextEditingController();
  final _notesController = TextEditingController();
  String _paymentMethod = 'COD';
  bool _isCheckingOut = false;

  LatLng _deliveryLocation = const LatLng(14.8214, 120.9565); // Default to Santa Maria
  MapcnController? _mapController;

  @override
  void initState() {
    super.initState();
    _mapController = MapcnController(vsync: this);
    _loadDefaultAddress();
  }

  void _loadDefaultAddress() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user = Provider.of<AuthProvider>(context, listen: false).user;
      if (user != null) {
        if (user.defaultAddress != null) {
          _addressController.text = user.defaultAddress!;
        }
        if (user.defaultLat != null && user.defaultLng != null) {
          setState(() {
            _deliveryLocation = LatLng(user.defaultLat!, user.defaultLng!);
            if (_mapController != null) {
              _mapController!.flyTo(_deliveryLocation, zoom: 15);
            }
          });
        }
      }
    });
  }

  Future<void> _handleCheckout() async {
    final cart = Provider.of<CartProvider>(context, listen: false);
    if (cart.vendorId == null || cart.items.isEmpty) return;
    
    final address = _addressController.text.trim();
    if (address.isEmpty) {
      GlassToast.info(context, 'Delivery address is required');
      return;
    }

    setState(() {
      _isCheckingOut = true;
    });

    try {
      final payload = {
        'vendorId': cart.vendorId,
        'deliveryAddress': address,
        'notes': _notesController.text.trim(),
        'paymentMethod': _paymentMethod,
        'deliveryLat': _deliveryLocation.latitude,
        'deliveryLng': _deliveryLocation.longitude,
        'items': cart.items.map((i) => {
          'menuItemId': i.menuItem.id,
          'quantity': i.quantity,
        }).toList(),
      };
      
      final order = await orderService.placeOrder(payload);
      cart.clearCart();
      
      if (!mounted) return;
      Navigator.pushReplacement(context, MaterialPageRoute(
        builder: (_) => OrderDetailScreen(orderId: order.id),
      ));
    } catch (e) {
      if (mounted) GlassToast.error(context, e.toString().replaceAll('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _isCheckingOut = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = Provider.of<CartProvider>(context);

    if (cart.items.isEmpty) {
      return GlassScaffold(
        appBar: AppBar(backgroundColor: Colors.transparent),
        body: Center(
          child: Text('Your cart is empty', style: TextStyle(fontSize: 18, color: Theme.of(context).colorScheme.onSurface)),
        ),
      );
    }

    return GlassScaffold(
      appBar: GlassAppBar(
        title: Text('Review Order', style: TextStyle(fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.only(top: 100.0, left: 16.0, right: 16.0, bottom: 16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            NeumorphicCard(
              child: Column(
                children: [
                  for (var i = 0; i < cart.items.length; i++) ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(cart.items[i].menuItem.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                              Text('₱${cart.items[i].menuItem.price.toStringAsFixed(2)}', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6))),
                            ],
                          ),
                        ),
                        Row(
                          children: [
                            IconButton(
                              icon: const Icon(Icons.remove_circle_outline, color: AppColors.primary),
                              onPressed: () => cart.updateQuantity(cart.items[i].menuItem.id, cart.items[i].quantity - 1),
                            ),
                            Text('${cart.items[i].quantity}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                            IconButton(
                              icon: const Icon(Icons.add_circle_outline, color: AppColors.primary),
                              onPressed: () => cart.updateQuantity(cart.items[i].menuItem.id, cart.items[i].quantity + 1),
                            ),
                          ],
                        )
                      ],
                    ),
                    if (i < cart.items.length - 1) Divider(color: Theme.of(context).brightness == Brightness.dark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.05), height: 16),
                  ]
                ],
              ),
            ),
            const SizedBox(height: 24),
            Text('DELIVERY DETAILS', style: TextStyle(fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6), letterSpacing: 1.2, fontSize: 12)),
            const SizedBox(height: 8),
            NeumorphicCard(
              child: Column(
                children: [
                  TextField(
                    controller: _addressController,
                    decoration: InputDecoration(
                      labelText: 'Drop-off Address *',
                      filled: true,
                      fillColor: Colors.white.withOpacity(0.6),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Delivery Pin', style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6), fontWeight: FontWeight.bold)),
                      TextButton.icon(
                        onPressed: () async {
                          final status = await Permission.location.request();
                          if (status.isGranted) {
                            GlassToast.info(context, 'Locating you...');
                            try {
                              final position = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
                              final newLoc = LatLng(position.latitude, position.longitude);
                              setState(() {
                                _deliveryLocation = newLoc;
                                _mapController?.flyTo(newLoc, zoom: 16);
                              });
                            } catch (e) {
                              GlassToast.error(context, 'Failed to get location: $e');
                            }
                          } else {
                            GlassToast.error(context, 'Location permission denied');
                          }
                        },
                        icon: const Icon(Icons.my_location, size: 16),
                        label: const Text('Locate Me'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  GestureDetector(
                    onTap: () async {
                      final newLocation = await Navigator.push<LatLng>(
                        context,
                        MaterialPageRoute(
                          builder: (_) => MapSelectionScreen(initialLocation: _deliveryLocation),
                        ),
                      );
                      if (newLocation != null) {
                        setState(() {
                          _deliveryLocation = newLocation;
                          _mapController?.flyTo(newLocation, zoom: 15);
                        });
                      }
                    },
                    child: Container(
                      height: 180,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Theme.of(context).brightness == Brightness.dark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.05)),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: AbsorbPointer(
                          child: Stack(
                            alignment: Alignment.center,
                            children: [
                          Mapcn(
                            controller: _mapController,
                            initialCenter: _deliveryLocation,
                            initialZoom: 15,
                            style: Theme.of(context).brightness == Brightness.dark ? MapcnStyle.midnight : MapcnStyle.normal,
                            accentColor: AppColors.primary,
                            markerConfig: const MarkerConfig(
                              style: MarkerStyle.pulse,
                              pulseRadius: 35,
                              glowIntensity: 0.8,
                              showShadow: true,
                              coreRadius: 8,
                            ),
                            points: [_deliveryLocation],
                          ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _notesController,
                    decoration: InputDecoration(
                      labelText: 'Notes for Rider',
                      filled: true,
                      fillColor: Colors.white.withOpacity(0.6),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                    ),
                    maxLines: 2,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Text('PAYMENT METHOD', style: TextStyle(fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6), letterSpacing: 1.2, fontSize: 12)),
            const SizedBox(height: 8),
            NeumorphicCard(
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final method in ['COD', 'GCASH', 'MAYA', 'QRPH'])
                    ChoiceChip(
                      label: Text(method),
                      selected: _paymentMethod == method,
                      onSelected: (val) {
                        if (val) setState(() => _paymentMethod = method);
                      },
                      selectedColor: AppColors.primary.withValues(alpha: 0.1),
                      labelStyle: TextStyle(
                        color: _paymentMethod == method ? AppColors.primary : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                        fontWeight: _paymentMethod == method ? FontWeight.bold : FontWeight.normal,
                      ),
                      backgroundColor: Colors.white.withOpacity(0.4),
                      side: BorderSide(color: _paymentMethod == method ? AppColors.primary.withValues(alpha: 0.5) : Theme.of(context).brightness == Brightness.dark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.05)),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            NeumorphicCard(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Total Payout', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface)),
                  Text('₱${cart.total.toStringAsFixed(2)}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.primary)),
                ],
              ),
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: _isCheckingOut ? null : _handleCheckout,
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: _isCheckingOut
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Confirm & Place Order', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ),
            const SizedBox(height: 120),
          ],
        ),
      ),
    );
  }
}
