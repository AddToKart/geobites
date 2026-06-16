import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:mapcn_flutter/mapcn_flutter.dart';
import 'package:latlong2/latlong.dart';
import '../../theme/glass_theme.dart';

class MapSelectionResult {
  final LatLng location;
  final String address;

  MapSelectionResult({required this.location, required this.address});
}

class MapSelectionScreen extends StatefulWidget {
  final LatLng initialLocation;

  const MapSelectionScreen({Key? key, required this.initialLocation}) : super(key: key);

  @override
  _MapSelectionScreenState createState() => _MapSelectionScreenState();
}

class _MapSelectionScreenState extends State<MapSelectionScreen> with TickerProviderStateMixin {
  late LatLng _selectedLocation;
  late MapcnController _mapController;
  String _selectedMode = '2D'; // '2D', '3D', 'Low Fidel'
  String _addressText = 'Loading address...';
  Timer? _debounceTimer;

  @override
  void initState() {
    super.initState();
    _selectedLocation = widget.initialLocation;
    _mapController = MapcnController(vsync: this);
    _fetchAddress(_selectedLocation);
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchAddress(LatLng position) async {
    try {
      final url = Uri.parse(
          'https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.latitude}&lon=${position.longitude}&zoom=18&addressdetails=1');
      final response = await http.get(url, headers: {
        'User-Agent': 'GeoBites_App_Flutter',
      });
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final address = data['address'];
        if (address != null) {
          final road = address['road'] ?? address['street'] ?? '';
          final neighbourhood = address['neighbourhood'] ?? address['suburb'] ?? '';
          final barangay = address['village'] ?? address['quarter'] ?? address['suburb'] ?? '';
          final city = address['city'] ?? address['municipality'] ?? address['town'] ?? '';
          
          final List<String> parts = [];
          if (road.isNotEmpty) parts.add(road);
          if (neighbourhood.isNotEmpty) parts.add(neighbourhood);
          if (barangay.isNotEmpty && barangay != neighbourhood) parts.add(barangay);
          if (city.isNotEmpty) parts.add(city);
          
          final fullAddress = parts.isNotEmpty ? parts.join(', ') : (data['display_name'] ?? 'Unknown location');
          
          if (mounted) {
            setState(() {
              _addressText = fullAddress;
            });
          }
        } else {
          if (mounted) {
            setState(() {
              _addressText = 'Unknown location';
            });
          }
        }
      }
    } catch (e) {
      print('Error fetching address: $e');
      if (mounted) {
        setState(() {
          _addressText = 'Coordinates: ${position.latitude.toStringAsFixed(5)}, ${position.longitude.toStringAsFixed(5)}';
        });
      }
    }
  }

  MapcnStyle _getMapStyle() {
    if (_selectedMode == 'Low Fidel') return MapcnStyle.silver;
    if (_selectedMode == '3D') return MapcnStyle.midnight;
    // 2D
    return Theme.of(context).brightness == Brightness.dark ? MapcnStyle.dark : MapcnStyle.normal;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.5),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.arrow_back, color: Colors.white),
          ),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Stack(
        children: [
          Mapcn(
            controller: _mapController,
            initialCenter: _selectedLocation,
            initialZoom: _selectedMode == '3D' ? 18 : 16,
            style: _getMapStyle(),
            accentColor: AppColors.primary,
            onCameraMove: (camera, hasGesture) {
              setState(() {
                _selectedLocation = camera.center;
                _addressText = 'Loading address...';
              });
              _debounceTimer?.cancel();
              _debounceTimer = Timer(const Duration(milliseconds: 600), () {
                _fetchAddress(camera.center);
              });
            },
          ),
          
          // Center Crosshair Pin
          Center(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 40.0), // Offset so the pin points exactly at the center
              child: Stack(
                alignment: Alignment.center,
                children: [
                  Icon(Icons.location_on, size: 50, color: AppColors.primary),
                  Positioned(
                    top: 10,
                    child: Container(
                      width: 12,
                      height: 12,
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          // Instructions
          Positioned(
            top: 100,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.7),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'Drag map to set the pin location',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ),

          // Controls at bottom
          Positioned(
            bottom: 40,
            left: 16,
            right: 16,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Map Mode selector
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.9),
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10),
                    ],
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: ['2D', '3D', 'Low Fidel'].map((mode) {
                      final isSelected = _selectedMode == mode;
                      return Expanded(
                        child: GestureDetector(
                          onTap: () {
                            setState(() {
                              _selectedMode = mode;
                              if (mode == '3D') {
                                _mapController.zoomStep(2);
                              } else if (mode == '2D') {
                                _mapController.flyTo(_selectedLocation, zoom: 16);
                              }
                            });
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            decoration: BoxDecoration(
                              color: isSelected ? AppColors.primary : Colors.transparent,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              mode,
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: isSelected ? Colors.white : Colors.black87,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
                const SizedBox(height: 16),
                
                // Address Card
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.surface.withValues(alpha: 0.95),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: Theme.of(context).brightness == Brightness.dark 
                          ? Colors.white.withValues(alpha: 0.1) 
                          : Colors.black.withValues(alpha: 0.05)
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.15),
                        blurRadius: 10,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.location_on, color: AppColors.primary, size: 24),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'PINNED LOCATION',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                                letterSpacing: 1.2,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _addressText,
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Confirm Button
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: FilledButton(
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      elevation: 5,
                    ),
                    onPressed: () {
                      Navigator.pop(
                        context,
                        MapSelectionResult(
                          location: _selectedLocation,
                          address: _addressText,
                        ),
                      );
                    },
                    child: const Text('Confirm Location', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
