import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:dio/dio.dart';
import 'package:mapcn_flutter/mapcn_flutter.dart';
import 'package:latlong2/latlong.dart';
import '../../models/vendor.dart';
import '../../services/vendor_service.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../theme/glass_theme.dart';
import '../../widgets/vendor_card.dart';
import 'vendor_detail_screen.dart';
import 'customer_profile_screen.dart';
import 'cart_screen.dart';

class BrowseScreen extends StatefulWidget {
  @override
  _BrowseScreenState createState() => _BrowseScreenState();
}

class _BrowseScreenState extends State<BrowseScreen> {
  List<Vendor> _vendors = [];
  bool _isLoading = true;
  String _searchQuery = '';
  String _selectedCategory = 'ALL';
  String _viewMode = 'LIST'; // 'GRID', 'LIST', 'MAP'
  
  double? _currentTemperature;
  String _currentGreeting = 'DAY';

  @override
  void initState() {
    super.initState();
    _loadVendors();
    _loadRealtimeWeather();
  }

  Future<void> _loadRealtimeWeather() async {
    try {
      final hour = DateTime.now().hour;
      if (hour >= 5 && hour < 12) {
        _currentGreeting = 'MORNING';
      } else if (hour >= 12 && hour < 17) {
        _currentGreeting = 'AFTERNOON';
      } else if (hour >= 17 && hour < 20) {
        _currentGreeting = 'EVENING';
      } else {
        _currentGreeting = 'NIGHT';
      }

      // Fetch realtime weather for Santa Maria (approx coords)
      final response = await Dio().get('https://api.open-meteo.com/v1/forecast?latitude=14.8214&longitude=120.9565&current_weather=true');
      if (response.data != null && response.data['current_weather'] != null) {
        setState(() {
          _currentTemperature = (response.data['current_weather']['temperature'] as num).toDouble();
        });
      }
    } catch (e) {
      print('Error fetching weather: $e');
    }
  }

  Future<void> _loadVendors() async {
    setState(() => _isLoading = true);
    try {
      final vendors = await vendorService.getVendors();
      setState(() {
        _vendors = vendors;
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading vendors: $e');
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).user;
    final filteredVendors = _vendors.where((v) {
      final matchesSearch = v.name.toLowerCase().contains(_searchQuery.toLowerCase());
      if (_selectedCategory == 'ALL') return matchesSearch;
      
      final categoryLower = _selectedCategory.toLowerCase();
      // Basic mock category matching: checking if name or description contains the tag
      final matchesCategory = v.name.toLowerCase().contains(categoryLower) || 
                              (v.description?.toLowerCase().contains(categoryLower) ?? false);
                              
      return matchesSearch && matchesCategory;
    }).toList();

    return GlassScaffold(
      appBar: GlassAppBar(
        title: GestureDetector(
          onTap: () {
            Navigator.push(context, MaterialPageRoute(builder: (_) => const CustomerProfileScreen()));
          },
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Deliver to', style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6))),
              Row(
                children: [
                  Text(
                    user?.address ?? 'Current Location',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface),
                  ),
                  const SizedBox(width: 4),
                  const Icon(Icons.keyboard_arrow_down, size: 16, color: AppColors.primary),
                ],
              ),
            ],
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(
              Provider.of<ThemeProvider>(context).themeMode == ThemeMode.dark ? Icons.light_mode : Icons.dark_mode, 
              color: Theme.of(context).colorScheme.onSurface
            ),
            onPressed: () {
              Provider.of<ThemeProvider>(context, listen: false).toggleTheme();
            },
          ),
          IconButton(
            icon: Icon(Icons.shopping_bag_outlined, color: Theme.of(context).colorScheme.onSurface),
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => CartScreen()));
            },
          ),
          IconButton(
            icon: Icon(Icons.person_outline, color: Theme.of(context).colorScheme.onSurface),
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const CustomerProfileScreen()));
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadVendors,
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.only(top: 24.0, left: 16.0, right: 16.0, bottom: 16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Weather/Time Header
                    Row(
                      children: [
                        const Icon(Icons.wb_twilight, color: AppColors.primary, size: 16),
                        const SizedBox(width: 8),
                        Text(
                          '$_currentGreeting IN SANTA MARIA • ${_currentTemperature != null ? "${_currentTemperature!.toStringAsFixed(1)}°C" : "--°C"}',
                          style: TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.5,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'What are you\ncraving?',
                      style: Theme.of(context).textTheme.displayMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).colorScheme.onSurface,
                        height: 1.1,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${filteredVendors.length} curated spots open right now',
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 32),
                    TextField(
                      onChanged: (val) => setState(() => _searchQuery = val),
                      decoration: InputDecoration(
                        hintText: 'Search restaurants, groceries, or dishes...',
                        filled: true,
                        fillColor: Theme.of(context).colorScheme.surface.withOpacity(0.5),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide.none,
                        ),
                        prefixIcon: Icon(Icons.search, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6)),
                      ),
                    ),
                    const SizedBox(height: 24),
                    // Categories
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: ['ALL', 'SILOG', 'IHAW-IHAW', 'SNACKS', 'DRINKS'].map((category) {
                          final isSelected = _selectedCategory == category;
                          return Padding(
                            padding: const EdgeInsets.only(right: 8.0),
                            child: GestureDetector(
                              onTap: () => setState(() => _selectedCategory = category),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                                decoration: BoxDecoration(
                                  color: isSelected ? AppColors.primary : Colors.transparent,
                                  border: Border.all(color: isSelected ? AppColors.primary : Theme.of(context).colorScheme.onSurface.withOpacity(0.1)),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  category,
                                  style: TextStyle(
                                    color: isSelected ? Colors.white : Theme.of(context).colorScheme.onSurface,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                    const SizedBox(height: 48),
                    // Explore & View Toggles
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Explore local kitchens',
                          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface),
                        ),
                        Container(
                          decoration: BoxDecoration(
                            border: Border.all(color: Theme.of(context).colorScheme.onSurface.withOpacity(0.1)),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Row(
                            children: ['GRID', 'LIST', 'MAP'].map((mode) {
                              final isSelected = _viewMode == mode;
                              final isDark = Theme.of(context).brightness == Brightness.dark;
                              return GestureDetector(
                                onTap: () => setState(() => _viewMode = mode),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: isSelected ? (isDark ? Colors.white : Colors.black) : Colors.transparent,
                                  ),
                                  child: Text(
                                    mode,
                                    style: TextStyle(
                                      color: isSelected ? (isDark ? Colors.black : Colors.white) : Theme.of(context).colorScheme.onSurface,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 10,
                                    ),
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            if (_isLoading)
              const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator()),
              )
            else if (filteredVendors.isEmpty)
              const SliverFillRemaining(
                child: Center(child: Text('No restaurants found.')),
              )
            else if (_viewMode == 'GRID')
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                sliver: SliverGrid(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.75,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                  ),
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      return VendorCard(
                        vendor: filteredVendors[index],
                        onTap: () {
                          Navigator.push(context, MaterialPageRoute(
                            builder: (_) => VendorDetailScreen(vendor: filteredVendors[index]),
                          ));
                        },
                      );
                    },
                    childCount: filteredVendors.length,
                  ),
                ),
              )
            else if (_viewMode == 'MAP')
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  child: Container(
                    height: 400,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Theme.of(context).colorScheme.onSurface.withOpacity(0.1)),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: Mapcn(
                        initialCenter: const LatLng(14.8214, 120.9565), // Center of Santa Maria
                        initialZoom: 14,
                        style: Theme.of(context).brightness == Brightness.dark ? MapcnStyle.midnight : MapcnStyle.normal,
                        accentColor: AppColors.primary,
                        markerConfig: const MarkerConfig(
                          style: MarkerStyle.pulse,
                          pulseRadius: 35,
                          glowIntensity: 0.8,
                          showShadow: true,
                          coreRadius: 8,
                        ),
                        points: filteredVendors.map((v) => LatLng(v.latitude, v.longitude)).toList(),
                      ),
                    ),
                  ),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16.0),
                        child: VendorCard(
                          vendor: filteredVendors[index],
                          onTap: () {
                            Navigator.push(context, MaterialPageRoute(
                              builder: (_) => VendorDetailScreen(vendor: filteredVendors[index]),
                            ));
                          },
                        ),
                      );
                    },
                    childCount: filteredVendors.length,
                  ),
                ),
              ),
            const SliverToBoxAdapter(child: SizedBox(height: 80)),
          ],
        ),
      ),
    );
  }
}
