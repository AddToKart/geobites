import 'package:flutter/material.dart';
import 'package:mapcn_flutter/mapcn_flutter.dart';
import 'package:latlong2/latlong.dart';
import '../../theme/glass_theme.dart';

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

  @override
  void initState() {
    super.initState();
    _selectedLocation = widget.initialLocation;
    _mapController = MapcnController(vsync: this);
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
                      Navigator.pop(context, _mapController.center);
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
