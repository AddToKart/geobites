import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:mapcn_flutter/mapcn_flutter.dart';
import 'package:latlong2/latlong.dart';
import '../../theme/glass_theme.dart';
import '../../widgets/locate_me_button.dart';

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

  // Search state
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocus = FocusNode();
  List<Map<String, dynamic>> _searchResults = [];
  bool _isSearching = false;
  bool _showSearchResults = false;

  @override
  void initState() {
    super.initState();
    _selectedLocation = widget.initialLocation;
    _mapController = MapcnController(vsync: this);
    _fetchAddress(_selectedLocation);

    _searchFocus.addListener(() {
      if (!_searchFocus.hasFocus && mounted) {
        setState(() => _showSearchResults = false);
      }
    });
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _searchController.dispose();
    _searchFocus.dispose();
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

  Future<void> _performSearch(String query) async {
    if (query.trim().isEmpty) {
      if (mounted) setState(() { _searchResults = []; _showSearchResults = false; });
      return;
    }
    if (mounted) setState(() => _isSearching = true);
    try {
      final url = Uri.parse(
          'https://nominatim.openstreetmap.org/search?format=json&q=${Uri.encodeComponent(query)}&limit=5&addressdetails=1');
      final response = await http.get(url, headers: {
        'User-Agent': 'GeoBites_App_Flutter',
      });
      if (response.statusCode == 200 && mounted) {
        final List<dynamic> data = json.decode(response.body);
        setState(() {
          _searchResults = data.cast<Map<String, dynamic>>();
          _showSearchResults = _searchResults.isNotEmpty;
          _isSearching = false;
        });
      } else {
        if (mounted) setState(() { _isSearching = false; _showSearchResults = false; });
      }
    } catch (e) {
      print('Search error: $e');
      if (mounted) setState(() { _isSearching = false; _showSearchResults = false; });
    }
  }

  void _selectSearchResult(Map<String, dynamic> result) {
    final double lat = double.tryParse(result['lat']?.toString() ?? '') ?? 0;
    final double lon = double.tryParse(result['lon']?.toString() ?? '') ?? 0;
    final LatLng newLocation = LatLng(lat, lon);

    final address = result['address'] as Map<String, dynamic>?;
    String displayName = result['display_name'] ?? 'Unknown location';
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
      if (parts.isNotEmpty) displayName = parts.join(', ');
    }

    setState(() {
      _selectedLocation = newLocation;
      _addressText = displayName;
      _searchController.text = displayName;
      _showSearchResults = false;
      _searchResults = [];
    });

    _searchFocus.unfocus();
    _mapController.flyTo(newLocation, zoom: 17);
  }

  MapcnStyle _getMapStyle() {
    if (_selectedMode == 'Low Fidel') return MapcnStyle.silver;
    if (_selectedMode == '3D') return MapcnStyle.midnight;
    // 2D
    return Theme.of(context).brightness == Brightness.dark ? MapcnStyle.dark : MapcnStyle.normal;
  }

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.of(context).padding.top;

    return Scaffold(
      resizeToAvoidBottomInset: false,
      body: Stack(
        children: [
          // ─── Map ───────────────────────────────────────────────────────────
          Positioned.fill(
            child: Mapcn(
              controller: _mapController,
              initialCenter: _selectedLocation,
              initialZoom: _selectedMode == '3D' ? 18 : 16,
              style: _getMapStyle(),
              accentColor: AppColors.primary,
              onCameraMove: (camera, hasGesture) {
                if (hasGesture) {
                  setState(() {
                    _selectedLocation = camera.center;
                    _addressText = 'Loading address...';
                    _showSearchResults = false;
                  });
                  _debounceTimer?.cancel();
                  _debounceTimer = Timer(const Duration(milliseconds: 600), () {
                    _fetchAddress(camera.center);
                  });
                }
              },
            ),
          ),

          // ─── Center Crosshair Pin ──────────────────────────────────────────
          Center(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 40.0),
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

          // ─── Top Search Bar Overlay ────────────────────────────────────────
          Positioned(
            top: topPadding + 8,
            left: 12,
            right: 12,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Search row: back button + search field
                Row(
                  children: [
                    // Back button
                    GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: Theme.of(context).brightness == Brightness.dark
                              ? Colors.black.withValues(alpha: 0.75)
                              : Colors.white.withValues(alpha: 0.92),
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(color: Colors.black.withValues(alpha: 0.2), blurRadius: 8),
                          ],
                        ),
                        child: Icon(
                          Icons.arrow_back,
                          color: Theme.of(context).brightness == Brightness.dark
                              ? Colors.white
                              : Colors.black87,
                          size: 20,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),

                    // Search field
                    Expanded(
                      child: Container(
                        decoration: BoxDecoration(
                          color: Theme.of(context).brightness == Brightness.dark
                              ? Colors.black.withValues(alpha: 0.82)
                              : Colors.white.withValues(alpha: 0.96),
                          borderRadius: BorderRadius.circular(kSharpRadius),
                          boxShadow: [
                            BoxShadow(color: Colors.black.withValues(alpha: 0.15), blurRadius: 12, offset: const Offset(0, 4)),
                          ],
                        ),
                        child: TextField(
                          controller: _searchController,
                          focusNode: _searchFocus,
                          textInputAction: TextInputAction.search,
                          style: TextStyle(
                            color: Theme.of(context).brightness == Brightness.dark ? Colors.white : Colors.black87,
                            fontSize: 14,
                          ),
                          decoration: InputDecoration(
                            hintText: 'Search street, barangay, area...',
                            hintStyle: TextStyle(
                              color: Theme.of(context).brightness == Brightness.dark
                                  ? Colors.white54
                                  : Colors.black38,
                              fontSize: 13,
                            ),
                            prefixIcon: _isSearching
                                ? const Padding(
                                    padding: EdgeInsets.all(12),
                                    child: SizedBox(
                                      width: 16,
                                      height: 16,
                                      child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                                    ),
                                  )
                                : const Icon(Icons.search, color: AppColors.primary, size: 20),
                            suffixIcon: _searchController.text.isNotEmpty
                                ? IconButton(
                                    icon: const Icon(Icons.close, size: 18),
                                    color: Colors.grey,
                                    onPressed: () {
                                      _searchController.clear();
                                      setState(() {
                                        _searchResults = [];
                                        _showSearchResults = false;
                                      });
                                    },
                                  )
                                : null,
                            border: InputBorder.none,
                            contentPadding: const EdgeInsets.symmetric(vertical: 13, horizontal: 4),
                          ),
                          onChanged: (value) {
                            setState(() {}); // rebuild to show/hide clear button
                            _debounceTimer?.cancel();
                            _debounceTimer = Timer(const Duration(milliseconds: 500), () {
                              _performSearch(value);
                            });
                          },
                          onSubmitted: (value) => _performSearch(value),
                        ),
                      ),
                    ),
                  ],
                ),

                // Search Results Dropdown
                if (_showSearchResults && _searchResults.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Container(
                    decoration: BoxDecoration(
                      color: Theme.of(context).brightness == Brightness.dark
                          ? const Color(0xFF1C1C1E).withValues(alpha: 0.97)
                          : Colors.white.withValues(alpha: 0.98),
                      borderRadius: BorderRadius.circular(kSharpRadius),
                      boxShadow: [
                        BoxShadow(color: Colors.black.withValues(alpha: 0.2), blurRadius: 16, offset: const Offset(0, 6)),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(kSharpRadius),
                      child: Column(
                        children: _searchResults.asMap().entries.map((entry) {
                          final i = entry.key;
                          final result = entry.value;
                          final displayName = result['display_name'] ?? 'Unknown';
                          // Shorten display name smartly
                          final parts = displayName.split(', ');
                          final shortName = parts.take(3).join(', ');

                          return InkWell(
                            onTap: () => _selectSearchResult(result),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              decoration: BoxDecoration(
                                border: i < _searchResults.length - 1
                                    ? Border(bottom: BorderSide(color: Colors.grey.withValues(alpha: 0.12)))
                                    : null,
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    width: 32,
                                    height: 32,
                                    decoration: BoxDecoration(
                                      color: AppColors.primary.withValues(alpha: 0.12),
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(Icons.place_outlined, color: AppColors.primary, size: 18),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Text(
                                      shortName,
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w500,
                                        color: Theme.of(context).brightness == Brightness.dark
                                            ? Colors.white
                                            : Colors.black87,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),

          // ─── "Drag map" hint (only when search not focused) ───────────────
          if (!_showSearchResults)
            Positioned(
              top: topPadding + 72,
              left: 0,
              right: 0,
              child: Center(
                child: AnimatedOpacity(
                  opacity: _searchFocus.hasFocus ? 0 : 1,
                  duration: const Duration(milliseconds: 200),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.6),
                      borderRadius: BorderRadius.circular(kSharpRadius),
                    ),
                    child: const Text(
                      'Drag map to set the pin location',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                  ),
                ),
              ),
            ),

          // ─── Locate Me Button ──────────────────────────────────────────────
          Positioned(
            bottom: 300,
            right: 16,
            child: LocateMeButton(
              mapController: _mapController,
              onLocated: (pos) {
                final loc = LatLng(pos.latitude, pos.longitude);
                setState(() {
                  _selectedLocation = loc;
                  _addressText = 'Loading address...';
                });
                _fetchAddress(loc);
              },
            ),
          ),

          // ─── Bottom Controls ───────────────────────────────────────────────
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
                    color: Colors.white.withValues(alpha: 0.9),
                    borderRadius: BorderRadius.circular(kSharpRadius),
                    boxShadow: [
                      BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 10),
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
                              borderRadius: BorderRadius.circular(kSharpRadius),
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
                    borderRadius: BorderRadius.circular(kSharpRadius),
                    border: Border.all(
                      color: Theme.of(context).brightness == Brightness.dark
                          ? Colors.white.withValues(alpha: 0.1)
                          : Colors.black.withValues(alpha: 0.05),
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
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(kSharpRadius)),
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
