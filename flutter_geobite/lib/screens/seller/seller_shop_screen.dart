import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../../models/vendor.dart';
import '../../services/vendor_service.dart';
import '../../providers/auth_provider.dart';
import '../../theme/glass_theme.dart';

class SellerShopScreen extends StatefulWidget {
  const SellerShopScreen({Key? key}) : super(key: key);

  @override
  _SellerShopScreenState createState() => _SellerShopScreenState();
}

class _SellerShopScreenState extends State<SellerShopScreen> {
  final _nameCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  Vendor? _vendor;
  bool _isLoading = true;
  bool _isSaving = false;

  LatLng _shopLocation = const LatLng(14.8214, 120.9565); // Default to Santa Maria
  GoogleMapController? _mapController;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final vendors = await vendorService.getVendors();
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final myVendor = vendors.firstWhere((v) => v.userId == auth.user?.id, orElse: () => throw Exception('Not found'));
      
      _vendor = myVendor;
      _nameCtrl.text = myVendor.name;
      _addressCtrl.text = myVendor.address;
      if (_vendor != null) {
        _shopLocation = LatLng(myVendor.latitude, myVendor.longitude);
      }
    } catch (e) {
      print('Vendor profile not set up: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _saveProfile() async {
    final name = _nameCtrl.text.trim();
    final address = _addressCtrl.text.trim();
    if (name.isEmpty || address.isEmpty) return;

    setState(() => _isSaving = true);
    try {
      final payload = {
        'name': name,
        'address': address,
        'lat': _shopLocation.latitude,
        'lng': _shopLocation.longitude,
      };

      if (_vendor == null) {
        // Create
        final auth = Provider.of<AuthProvider>(context, listen: false);
        payload['userId'] = auth.user!.id;
        final newVendor = await vendorService.createVendor(payload);
        setState(() => _vendor = newVendor);
      } else {
        // Update
        await vendorService.updateVendor(_vendor!.id, payload);
      }
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Shop Profile Saved!')));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error saving: $e')));
    } finally {
      setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: Text('Shop Settings', style: TextStyle(fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface)),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: NeumorphicCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    TextField(
                      controller: _nameCtrl,
                      decoration: InputDecoration(
                        labelText: 'Shop Name',
                        filled: true,
                        fillColor: Colors.white.withOpacity(0.6),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _addressCtrl,
                      decoration: InputDecoration(
                        labelText: 'Shop Address',
                        filled: true,
                        fillColor: Colors.white.withOpacity(0.6),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text('Pin Location (Drag map)', style: TextStyle(fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6))),
                    const SizedBox(height: 8),
                    Container(
                      height: 200,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12), 
                        border: Border.all(color: Theme.of(context).brightness == Brightness.dark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.05))
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            GoogleMap(
                              initialCameraPosition: CameraPosition(target: _shopLocation, zoom: 15),
                              onMapCreated: (controller) => _mapController = controller,
                              onCameraMove: (position) => _shopLocation = position.target,
                              myLocationEnabled: true,
                              myLocationButtonEnabled: false,
                              zoomControlsEnabled: false,
                            ),
                            const Icon(Icons.storefront, size: 40, color: AppColors.primary),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    FilledButton(
                      onPressed: _isSaving ? null : _saveProfile,
                      style: FilledButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: _isSaving 
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Text('Save Profile', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
