import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:mapcn_flutter/mapcn_flutter.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../services/auth_service.dart';
import '../../services/api_client.dart';
import '../../theme/glass_theme.dart';
import 'map_selection_screen.dart';

class CustomerProfileScreen extends StatefulWidget {
  const CustomerProfileScreen({Key? key}) : super(key: key);

  @override
  _CustomerProfileScreenState createState() => _CustomerProfileScreenState();
}

class _CustomerProfileScreenState extends State<CustomerProfileScreen> with TickerProviderStateMixin {
  int _selectedTab = 0; // 0: Profile Details, 1: Saved Addresses
  final _addressCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  LatLng _defaultLocation = const LatLng(14.8214, 120.9565); // Default to Santa Maria
  MapcnController? _mapController;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _mapController = MapcnController(vsync: this);
    _loadUserData();
  }

  void _loadUserData() {
    final user = Provider.of<AuthProvider>(context, listen: false).user;
    if (user != null) {
      if (user.defaultAddress != null) _addressCtrl.text = user.defaultAddress!;
      if (user.phone != null) _phoneCtrl.text = user.phone!;
      _nameCtrl.text = user.name;
      _emailCtrl.text = user.email;
      if (user.defaultLat != null && user.defaultLng != null) {
        _defaultLocation = LatLng(user.defaultLat!, user.defaultLng!);
      }
    }
  }

  Future<void> _saveProfile() async {
    final address = _addressCtrl.text.trim();
    final phone = _phoneCtrl.text.trim();
    if (address.isEmpty || phone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill all required fields')));
      return;
    }

    setState(() => _isSaving = true);
    try {
      final user = Provider.of<AuthProvider>(context, listen: false).user;
      if (user != null) {
        await apiClient.put('/user/profile', body: {
          'defaultAddress': address,
          'phone': phone,
          'defaultLat': _defaultLocation.latitude,
          'defaultLng': _defaultLocation.longitude,
        });
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Default address saved!')));
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error saving: $e')));
    } finally {
      setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        automaticallyImplyLeading: false,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              color: isDark ? Colors.white : Colors.black,
              child: Text('G', style: TextStyle(color: isDark ? Colors.black : Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
            ),
            const SizedBox(width: 12),
            Text('GEOBITES', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Theme.of(context).colorScheme.onSurface, letterSpacing: 1.5)),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(isDark ? Icons.light_mode : Icons.dark_mode, color: Theme.of(context).colorScheme.onSurface),
            onPressed: () => Provider.of<ThemeProvider>(context, listen: false).toggleTheme(),
          ),
          IconButton(
            icon: Icon(Icons.menu, color: Theme.of(context).colorScheme.onSurface),
            onPressed: () {},
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('CONFIGURE', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5), letterSpacing: 2, fontSize: 12, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text('Settings', style: TextStyle(fontSize: 40, fontWeight: FontWeight.w900, color: Theme.of(context).colorScheme.onSurface, letterSpacing: -1)),
            const SizedBox(height: 16),
            Text(
              'Configure your profile settings, business details, default delivery addresses, and set system preferences.',
              style: TextStyle(fontSize: 16, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6), height: 1.5),
            ),
            const SizedBox(height: 24),
            TextButton(
              onPressed: () {
                // Return to dashboard/home if possible
                Navigator.popUntil(context, (route) => route.isFirst);
              },
              style: TextButton.styleFrom(padding: EdgeInsets.zero, alignment: Alignment.centerLeft),
              child: Text('BACK TO DASHBOARD', style: TextStyle(fontWeight: FontWeight.w800, letterSpacing: 1, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6))),
            ),
            const SizedBox(height: 32),
            
            // Custom TabBar
            Container(
              decoration: BoxDecoration(
                border: Border(bottom: BorderSide(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.1))),
              ),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _buildTab(0, Icons.person_outline, 'PROFILE DETAILS'),
                    const SizedBox(width: 16),
                    _buildTab(1, Icons.home_outlined, 'SAVED ADDRESSES'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 32),
            
            if (_selectedTab == 0) _buildProfileTab() else _buildAddressesTab(),
            
            const SizedBox(height: 64),
            Center(
              child: OutlinedButton.icon(
                icon: const Icon(Icons.logout, color: Colors.red),
                label: const Text('Sign Out', style: TextStyle(color: Colors.red, fontSize: 16, fontWeight: FontWeight.bold)),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Colors.red),
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                ),
                onPressed: () => auth.signOut(),
              ),
            ),
            const SizedBox(height: 100), // Space for bottom nav
          ],
        ),
      ),
    );
  }

  Widget _buildTab(int index, IconData icon, String label) {
    final isSelected = _selectedTab == index;
    return GestureDetector(
      onTap: () => setState(() => _selectedTab = index),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(
              color: isSelected ? Theme.of(context).colorScheme.onSurface : Colors.transparent,
              width: 2,
            ),
          ),
        ),
        child: Row(
          children: [
            Icon(icon, size: 16, color: isSelected ? Theme.of(context).colorScheme.onSurface : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5)),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 12,
                letterSpacing: 1,
                color: isSelected ? Theme.of(context).colorScheme.onSurface : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileTab() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('PROFILE DETAILS', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1.5, fontSize: 12, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5))),
        const SizedBox(height: 24),
        _buildFormField('FULL NAME', Icons.person_outline, _nameCtrl),
        const SizedBox(height: 24),
        _buildFormField('PHONE NUMBER', Icons.phone_outlined, _phoneCtrl),
        const SizedBox(height: 24),
        _buildFormField('EMAIL ADDRESS', Icons.email_outlined, _emailCtrl),
        const SizedBox(height: 32),
        SizedBox(
          width: double.infinity,
          height: 56,
          child: FilledButton(
            onPressed: _isSaving ? null : _saveProfile,
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.primary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: _isSaving 
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Text('Save Changes', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          ),
        ),
      ],
    );
  }

  Widget _buildFormField(String label, IconData icon, TextEditingController controller) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 14, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5)),
            const SizedBox(width: 8),
            Text(label, style: TextStyle(fontSize: 12, letterSpacing: 1, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5))),
          ],
        ),
        const SizedBox(height: 8),
        Container(
          color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.03),
          child: TextField(
            controller: controller,
            decoration: const InputDecoration(
              border: InputBorder.none,
              contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            ),
            style: TextStyle(fontSize: 16, color: Theme.of(context).colorScheme.onSurface),
          ),
        ),
      ],
    );
  }

  Widget _buildAddressesTab() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('DEFAULT DELIVERY ADDRESS', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1.5, fontSize: 12, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5))),
        const SizedBox(height: 24),
        _buildFormField('FULL ADDRESS', Icons.location_on_outlined, _addressCtrl),
        const SizedBox(height: 24),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('PIN LOCATION', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5))),
            TextButton.icon(
              onPressed: () async {
                final status = await Permission.location.request();
                if (status.isGranted) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Locating you...')));
                  try {
                    final position = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
                    final newLoc = LatLng(position.latitude, position.longitude);
                    setState(() {
                      _defaultLocation = newLoc;
                      _mapController?.flyTo(newLoc, zoom: 16);
                    });
                  } catch (e) {
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to get location: $e')));
                  }
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Location permission denied')));
                }
              },
              icon: const Icon(Icons.my_location, size: 14),
              label: const Text('Locate Me', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: () async {
            final newLocation = await Navigator.push<LatLng>(
              context,
              MaterialPageRoute(
                builder: (_) => MapSelectionScreen(initialLocation: _defaultLocation),
              ),
            );
            if (newLocation != null) {
              setState(() {
                _defaultLocation = newLocation;
                _mapController?.flyTo(newLocation, zoom: 15);
              });
            }
          },
          child: Container(
            height: 200,
            decoration: BoxDecoration(border: Border.all(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.1))),
            child: AbsorbPointer(
              child: Stack(
                alignment: Alignment.center,
                children: [
                  Mapcn(
                    controller: _mapController,
                    initialCenter: _defaultLocation,
                    initialZoom: 15,
                    style: Theme.of(context).brightness == Brightness.dark ? MapcnStyle.midnight : MapcnStyle.silver,
                    accentColor: AppColors.primary,
                    markerConfig: const MarkerConfig(
                      style: MarkerStyle.pulse,
                      pulseRadius: 35,
                      glowIntensity: 0.8,
                      showShadow: true,
                      coreRadius: 8,
                    ),
                    points: [_defaultLocation],
                  ),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: 32),
        SizedBox(
          width: double.infinity,
          height: 56,
          child: FilledButton(
            onPressed: _isSaving ? null : _saveProfile,
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.primary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: _isSaving 
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Text('Save Address', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          ),
        ),
      ],
    );
  }
}
