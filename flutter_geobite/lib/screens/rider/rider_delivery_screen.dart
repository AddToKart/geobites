import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:mapcn_flutter/mapcn_flutter.dart';
import 'package:latlong2/latlong.dart';
import '../../models/order.dart';
import '../../services/order_service.dart';
import '../../theme/glass_theme.dart';
import 'package:intl/intl.dart';
import 'rider_proof_of_delivery_screen.dart';
import '../../widgets/glass_toast.dart';
import 'package:geolocator/geolocator.dart';
import '../../services/socket_service.dart';

class RiderDeliveryScreen extends StatefulWidget {
  final Order order;

  const RiderDeliveryScreen({Key? key, required this.order}) : super(key: key);

  @override
  _RiderDeliveryScreenState createState() => _RiderDeliveryScreenState();
}

class _RiderDeliveryScreenState extends State<RiderDeliveryScreen> with TickerProviderStateMixin {
  bool _isLoading = false;
  late String _currentStatus;
  List<LatLng> _routePoints = [];
  
  MapcnStyle _mapStyle = MapcnStyle.midnight;
  MapcnController? _mapController;

  // HUD State
  Timer? _timer;
  String _currentTime = '';
  String _temperature = '--°C';
  IconData _weatherIcon = Icons.wb_sunny;
  int _currentSpeed = 0;
  Timer? _speedTimer;
  bool _isNavigating = false;
  StreamSubscription<Position>? _positionStream;
  
  // Real OSRM Data
  String _etaMinutes = '-- min';
  String _distanceKm = '-- km';
  
  // UI State
  bool _isCardMinimized = false;

  @override
  void initState() {
    super.initState();
    _currentStatus = widget.order.status;
    _mapController = MapcnController(vsync: this);
    
    _updateTime();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => _updateTime());
    _fetchWeather();
    
    _loadRouteForCurrentState();

    _positionStream = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10,
      ),
    ).listen((Position position) {
      if (_currentStatus == 'picked_up' || _currentStatus == 'delivering') {
        SocketService().emitRiderLocation(
          widget.order.id,
          position.latitude,
          position.longitude,
        );
      }
    });
  }

  void _updateTime() {
    if (mounted) {
      setState(() {
        _currentTime = DateFormat('h:mm a').format(DateTime.now());
      });
    }
  }

  Future<void> _fetchWeather() async {
    try {
      final url = Uri.parse('https://api.open-meteo.com/v1/forecast?latitude=14.8214&longitude=120.9565&current_weather=true');
      final response = await http.get(url);
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final temp = data['current_weather']['temperature'].round();
        final code = data['current_weather']['weathercode'];
        
        IconData icon = Icons.wb_sunny;
        if (code >= 1 && code <= 3) icon = Icons.cloud_queue;
        if (code >= 51 && code <= 65) icon = Icons.water_drop_outlined;
        if (code >= 71 && code <= 82) icon = Icons.ac_unit;
        if (code >= 95) icon = Icons.thunderstorm_outlined;

        if (mounted) {
          setState(() {
            _temperature = '$temp°C';
            _weatherIcon = icon;
          });
        }
      }
    } catch (e) {
      print('Weather fetch error: $e');
    }
  }

  void _startSimulation() {
    setState(() => _isNavigating = true);
    _speedTimer?.cancel();
    _speedTimer = Timer.periodic(const Duration(seconds: 2), (timer) {
      if (mounted) {
        setState(() {
          // Simulate fluctuating speed between 35 and 55 km/h
          _currentSpeed = 35 + (DateTime.now().millisecond % 20);
        });
      }
    });
  }

  void _stopSimulation() {
    setState(() {
      _isNavigating = false;
      _currentSpeed = 0;
    });
    _speedTimer?.cancel();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _speedTimer?.cancel();
    _positionStream?.cancel();
    super.dispose();
  }

  void _loadRouteForCurrentState() {
    final vendorLat = widget.order.vendor?.latitude ?? 14.8214;
    final vendorLng = widget.order.vendor?.longitude ?? 120.9565;
    final vendorLoc = LatLng(vendorLat, vendorLng);

    final deliveryLat = widget.order.deliveryLat ?? vendorLat + 0.01;
    final deliveryLng = widget.order.deliveryLng ?? vendorLng + 0.01;
    final deliveryLoc = LatLng(deliveryLat, deliveryLng);

    final isHeadingToCustomer = _currentStatus == 'picked_up' || _currentStatus == 'delivering';
    final targetLoc = isHeadingToCustomer ? deliveryLoc : vendorLoc;
    final startLoc = isHeadingToCustomer ? vendorLoc : LatLng(vendorLat - 0.01, vendorLng - 0.01); // Simulated rider location
    
    _fetchRoute(startLoc, targetLoc);
  }

  Future<void> _fetchRoute(LatLng start, LatLng end) async {
    try {
      final url = Uri.parse('http://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?geometries=geojson');
      final response = await http.get(url);
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final route = data['routes'][0];
        final coords = route['geometry']['coordinates'] as List;
        final distanceMeters = route['distance'];
        final durationSeconds = route['duration'];
        
        final points = coords.map((c) => LatLng(c[1] as double, c[0] as double)).toList();
        if (mounted) {
          setState(() {
            _routePoints = points;
            _distanceKm = '${(distanceMeters / 1000).toStringAsFixed(1)} km';
            _etaMinutes = '${(durationSeconds / 60).round()} min';
          });
        }
      } else {
        if (mounted) setState(() {
           _routePoints = [start, end];
           _distanceKm = '-- km';
           _etaMinutes = '-- min';
        });
      }
    } catch (e) {
      print('Route fetch error: $e');
      if (mounted) setState(() {
         _routePoints = [start, end];
         _distanceKm = '-- km';
         _etaMinutes = '-- min';
      });
    }
  }

  Future<void> _updateStatus(String newStatus) async {
    setState(() => _isLoading = true);
    try {
      await orderService.updateOrderStatus(widget.order.id, newStatus);
      if (mounted) {
        if (newStatus == 'delivered') {
          Navigator.pop(context); // Go back after marking delivered
        } else {
          setState(() {
            _currentStatus = newStatus;
            _isLoading = false;
            _routePoints = []; // clear while loading new route
          });
          _loadRouteForCurrentState();
        }
      }
    } catch (e) {
      if (mounted) {
        GlassToast.error(context, 'Failed to update status: $e');
        setState(() => _isLoading = false);
      }
    }
  }

  void _centerMap(LatLng start, LatLng end) {
    if (_mapController?.isReady == true) {
      _mapController?.fitAllPoints([start, end], padding: 80);
      _startSimulation();
    }
  }

  @override
  Widget build(BuildContext context) {
    _mapController ??= MapcnController(vsync: this);
    // Determine vendor location
    final vendorLat = widget.order.vendor?.latitude ?? 14.8214;
    final vendorLng = widget.order.vendor?.longitude ?? 120.9565;
    final vendorLoc = LatLng(vendorLat, vendorLng);

    // Determine delivery location
    final deliveryLat = widget.order.deliveryLat ?? vendorLat + 0.01;
    final deliveryLng = widget.order.deliveryLng ?? vendorLng + 0.01;
    final deliveryLoc = LatLng(deliveryLat, deliveryLng);

    final isHeadingToCustomer = _currentStatus == 'picked_up' || _currentStatus == 'delivering';
    final targetLoc = isHeadingToCustomer ? deliveryLoc : vendorLoc;
    final startLoc = isHeadingToCustomer ? vendorLoc : LatLng(vendorLat - 0.01, vendorLng - 0.01); // Simulated rider location
    final initialCenter = targetLoc;

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        title: Text(isHeadingToCustomer ? 'Customer Delivery' : 'Store Pickup', style: const TextStyle(fontWeight: FontWeight.bold, shadows: [Shadow(color: Colors.black54, blurRadius: 10)])),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white, shadows: [Shadow(color: Colors.black54, blurRadius: 10)]),
        titleTextStyle: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold, shadows: [Shadow(color: Colors.black54, blurRadius: 10)]),
      ),
      body: Stack(
        children: [
          // Full Screen Map View
          Positioned.fill(
            child: Mapcn(
              controller: _mapController,
              initialCenter: initialCenter,
              initialZoom: 14,
              style: _mapStyle,
              points: [startLoc, targetLoc],
              routes: [
                MapcnRoute(
                  points: _routePoints.isEmpty ? [startLoc, targetLoc] : _routePoints,
                  config: RouteConfig.liveTracking,
                ),
              ],
              markerConfig: const MarkerConfig(
                style: MarkerStyle.pulse,
                pulseRadius: 30,
              ),
            ),
          ),
          
          // HUD: Top Bar (Weather & Time)
          Positioned(
            top: MediaQuery.of(context).padding.top + 56 + 16, // Safe area + AppBar + padding
            right: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface.withValues(alpha: 0.85),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: 0.2), blurRadius: 10),
                ],
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(_weatherIcon, color: Colors.orange, size: 18),
                  const SizedBox(width: 6),
                  Text(_temperature, style: const TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(width: 12),
                  Container(width: 1, height: 16, color: Colors.grey.withValues(alpha: 0.3)),
                  const SizedBox(width: 12),
                  Text(_currentTime, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                ],
              ),
            ),
          ),

          // HUD: ETA & Distance (Top Left)
          Positioned(
            top: MediaQuery.of(context).padding.top + 56 + 16,
            left: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.9),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(color: AppColors.primary.withValues(alpha: 0.3), blurRadius: 12, offset: const Offset(0, 4)),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('ETA', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 2),
                  Text(_etaMinutes, style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(_distanceKm, style: const TextStyle(color: Colors.white70, fontSize: 12)),
                ],
              ),
            ),
          ),

          // HUD: Speedometer (Bottom Left - stays above card)
          AnimatedPositioned(
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeInOut,
            bottom: _isCardMinimized ? 180 : 320,
            left: 16,
            child: Container(
              width: 70,
              height: 70,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Theme.of(context).colorScheme.surface.withValues(alpha: 0.9),
                border: Border.all(color: _currentSpeed > 0 ? AppColors.primary : Colors.grey.withValues(alpha: 0.3), width: 3),
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: 0.2), blurRadius: 10),
                ],
              ),
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      '$_currentSpeed',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: _currentSpeed > 0 ? AppColors.primary : Theme.of(context).colorScheme.onSurface,
                      ),
                    ),
                    const Text('km/h', style: TextStyle(fontSize: 10, color: Colors.grey)),
                  ],
                ),
              ),
            ),
          ),

          // Map Style Toggles (Bottom Right - stays above card)
          AnimatedPositioned(
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeInOut,
            bottom: _isCardMinimized ? 180 : 320,
            right: 16,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface.withValues(alpha: 0.9),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _buildSmallToggle(MapcnStyle.normal, Icons.map),
                  const SizedBox(height: 4),
                  _buildSmallToggle(MapcnStyle.silver, Icons.layers_clear),
                  const SizedBox(height: 4),
                  _buildSmallToggle(MapcnStyle.midnight, Icons.dark_mode),
                ],
              ),
            ),
          ),

          // Minimizable Action Card
          AnimatedPositioned(
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeInOut,
            bottom: _isCardMinimized ? -140 : 0,
            left: 0,
            right: 0,
            child: GestureDetector(
              onVerticalDragUpdate: (details) {
                if (details.primaryDelta! > 5) {
                  setState(() => _isCardMinimized = true);
                } else if (details.primaryDelta! < -5) {
                  setState(() => _isCardMinimized = false);
                }
              },
              onTap: () {
                if (_isCardMinimized) setState(() => _isCardMinimized = false);
              },
              child: Container(
                height: 300,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withValues(alpha: 0.3), blurRadius: 20, offset: const Offset(0, -5)),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Handle for dragging
                    Center(
                      child: Container(
                        width: 40,
                        height: 5,
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: Colors.grey.withValues(alpha: 0.3),
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Order #${widget.order.id.substring(0, 8).toUpperCase()}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(12)),
                          child: Text(_currentStatus.toUpperCase().replaceAll('_', ' '), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    _buildInfoRow(
                      context, 
                      isHeadingToCustomer ? Icons.location_on : Icons.storefront, 
                      isHeadingToCustomer ? 'Heading to Customer' : 'Heading to Store', 
                      isHeadingToCustomer ? widget.order.deliveryAddress : (widget.order.vendor?.name ?? 'Store')
                    ),
                    const SizedBox(height: 24),
                    const Spacer(),
                    
                    if (_currentStatus == 'ready_for_pickup') ...[
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              icon: const Icon(Icons.navigation_outlined, size: 18),
                              onPressed: () {
                                setState(() => _isCardMinimized = true);
                                _centerMap(startLoc, targetLoc);
                              },
                              style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                              label: const Text('Navigate'),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: FilledButton(
                              onPressed: _isLoading ? null : () => _updateStatus('picked_up'),
                              style: FilledButton.styleFrom(backgroundColor: AppColors.primary, padding: const EdgeInsets.symmetric(vertical: 16)),
                              child: _isLoading
                                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                  : const Text('Order Picked Up', style: TextStyle(fontWeight: FontWeight.bold)),
                            ),
                          ),
                        ],
                      ),
                    ] else if (_currentStatus == 'picked_up' || _currentStatus == 'delivering') ...[
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              icon: const Icon(Icons.navigation_outlined, size: 18),
                              onPressed: () {
                                setState(() => _isCardMinimized = true);
                                _centerMap(startLoc, targetLoc);
                              },
                              style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                              label: const Text('Navigate'),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: FilledButton(
                              onPressed: _isLoading ? null : () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(builder: (_) => RiderProofOfDeliveryScreen(order: widget.order)),
                                );
                              },
                              style: FilledButton.styleFrom(backgroundColor: Colors.green, padding: const EdgeInsets.symmetric(vertical: 16)),
                              child: _isLoading
                                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                  : const Text('Mark Delivered', style: TextStyle(fontWeight: FontWeight.bold)),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSmallToggle(MapcnStyle style, IconData icon) {
    final isSelected = _mapStyle == style;
    return GestureDetector(
      onTap: () => setState(() => _mapStyle = style),
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, size: 20, color: isSelected ? Colors.white : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6)),
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
