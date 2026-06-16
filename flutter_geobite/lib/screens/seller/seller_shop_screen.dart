import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:provider/provider.dart';
import 'package:latlong2/latlong.dart';
import 'dart:io';
import 'package:file_picker/file_picker.dart';
import '../../models/vendor.dart';
import '../../services/vendor_service.dart';
import '../../services/upload_service.dart';
import '../../providers/auth_provider.dart';
import '../../theme/glass_theme.dart';
import '../../widgets/glass_toast.dart';
import '../customer/map_selection_screen.dart';
import 'seller_main_screen.dart';

class SellerShopScreen extends StatefulWidget {
  const SellerShopScreen({Key? key}) : super(key: key);

  @override
  _SellerShopScreenState createState() => _SellerShopScreenState();
}

class _SellerShopScreenState extends State<SellerShopScreen> {
  final _userNameCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  Vendor? _vendor;
  PlatformFile? _selectedCoverFile;
  String? _existingCoverUrl;
  bool _isLoading = true;
  bool _isSaving = false;

  LatLng _shopLocation = const LatLng(14.8214, 120.9565); // Default to Santa Maria

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
      _userNameCtrl.text = auth.user?.name ?? '';
      
      final myVendor = vendors.firstWhere((v) => v.userId == auth.user?.id, orElse: () => throw Exception('Not found'));
      
      _vendor = myVendor;
      _nameCtrl.text = myVendor.name;
      _addressCtrl.text = myVendor.address;
      if (_vendor != null) {
        _existingCoverUrl = myVendor.imageUrl;
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
    if (name.isEmpty || address.isEmpty) {
      GlassToast.error(context, 'Shop Name and Address are required!');
      return;
    }

    setState(() => _isSaving = true);
    try {
      String? finalImageUrl = _existingCoverUrl;
      if (_selectedCoverFile != null) {
        if (kIsWeb && _selectedCoverFile!.bytes != null) {
          finalImageUrl = await uploadService.uploadImageBytes(_selectedCoverFile!.bytes!, _selectedCoverFile!.name);
        } else if (!kIsWeb && _selectedCoverFile!.path != null) {
          finalImageUrl = await uploadService.uploadImage(_selectedCoverFile!.path!);
        }
      }

      final payload = {
        'name': name,
        'address': address,
        'latitude': _shopLocation.latitude,
        'longitude': _shopLocation.longitude,
        if (finalImageUrl != null) 'imageUrl': finalImageUrl,
      };

      bool wasNew = _vendor == null;
      if (wasNew) {
        // Create
        final newVendor = await vendorService.createVendor(payload);
        setState(() => _vendor = newVendor);
      } else {
        // Update
        await vendorService.updateVendor(_vendor!.id, payload);
      }
      GlassToast.success(context, 'Shop Profile Saved!');
      
      if (mounted) {
        // Go back to the Seller Homepage (SellerMainScreen)
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const SellerMainScreen()),
          (route) => false,
        );
      }
    } catch (e) {
      GlassToast.error(context, 'Error saving: $e');
    } finally {
      setState(() => _isSaving = false);
    }
  }

  Future<void> _pickCoverImage() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.image,
        allowMultiple: false,
        withData: kIsWeb, // Required for web to get bytes
      );
      if (result != null && result.files.isNotEmpty) {
        setState(() {
          _selectedCoverFile = result.files.single;
          _existingCoverUrl = null;
        });
      }
    } catch (e) {
      if (mounted) GlassToast.error(context, 'Failed to pick image: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return GlassScaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text('Shop Settings', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: NeumorphicCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text('Account Owner', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _userNameCtrl,
                      readOnly: true,
                      style: TextStyle(color: Theme.of(context).colorScheme.onSurface),
                      decoration: InputDecoration(
                        labelText: 'Your Full Name',
                        labelStyle: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6)),
                        filled: true,
                        fillColor: Theme.of(context).brightness == Brightness.dark ? Colors.white.withValues(alpha: 0.05) : Colors.white.withValues(alpha: 0.1),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(kSharpRadius), borderSide: BorderSide.none),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(kSharpRadius), borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.05))),
                        prefixIcon: const Padding(padding: EdgeInsets.only(left: 16.0, right: 8.0), child: Icon(Icons.person)),
                      ),
                    ),
                    const SizedBox(height: 32),
                    const Divider(),
                    const SizedBox(height: 16),
                    const Text('Shop Details', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                    const SizedBox(height: 16),
                    GestureDetector(
                      onTap: _pickCoverImage,
                      child: Container(
                        height: 150,
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.surface,
                          borderRadius: BorderRadius.circular(kSharpRadius),
                          border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
                          image: _selectedCoverFile != null
                              ? (kIsWeb && _selectedCoverFile!.bytes != null 
                                  ? DecorationImage(image: MemoryImage(_selectedCoverFile!.bytes!), fit: BoxFit.cover)
                                  : (!kIsWeb && _selectedCoverFile!.path != null 
                                      ? DecorationImage(image: FileImage(File(_selectedCoverFile!.path!)), fit: BoxFit.cover)
                                      : null))
                              : (_existingCoverUrl != null && _existingCoverUrl!.isNotEmpty
                                  ? DecorationImage(image: NetworkImage(_existingCoverUrl!), fit: BoxFit.cover)
                                  : null),
                        ),
                        child: _selectedCoverFile == null && (_existingCoverUrl == null || _existingCoverUrl!.isEmpty)
                            ? Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.add_photo_alternate_outlined, size: 40, color: AppColors.primary.withValues(alpha: 0.8)),
                                  const SizedBox(height: 8),
                                  Text('Upload Shop Cover Photo', style: TextStyle(color: AppColors.primary.withValues(alpha: 0.8))),
                                ],
                              )
                            : null,
                      ),
                    ),
                    const SizedBox(height: 24),
                    TextField(
                      controller: _nameCtrl,
                      style: TextStyle(color: Theme.of(context).colorScheme.onSurface),
                      decoration: InputDecoration(
                        labelText: 'Shop Name',
                        labelStyle: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6)),
                        filled: true,
                        fillColor: Theme.of(context).brightness == Brightness.dark ? Colors.white.withValues(alpha: 0.05) : Colors.white.withValues(alpha: 0.6),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(kSharpRadius), borderSide: BorderSide.none),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(kSharpRadius), borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.05))),
                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(kSharpRadius), borderSide: const BorderSide(color: AppColors.primary, width: 2)),
                        prefixIcon: const Padding(padding: EdgeInsets.only(left: 16.0, right: 8.0), child: Icon(Icons.storefront)),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _addressCtrl,
                      style: TextStyle(color: Theme.of(context).colorScheme.onSurface),
                      decoration: InputDecoration(
                        labelText: 'Shop Address',
                        labelStyle: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6)),
                        filled: true,
                        fillColor: Theme.of(context).brightness == Brightness.dark ? Colors.white.withValues(alpha: 0.05) : Colors.white.withValues(alpha: 0.6),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(kSharpRadius), borderSide: BorderSide.none),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(kSharpRadius), borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.05))),
                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(kSharpRadius), borderSide: const BorderSide(color: AppColors.primary, width: 2)),
                        prefixIcon: const Padding(padding: EdgeInsets.only(left: 16.0, right: 8.0), child: Icon(Icons.location_on)),
                      ),
                    ),
                    const SizedBox(height: 16),
                    const SizedBox(height: 16),
                    const Text('Location', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                    const SizedBox(height: 16),
                    GestureDetector(
                      onTap: () async {
                        final result = await Navigator.push<MapSelectionResult>(
                          context,
                          MaterialPageRoute(
                            builder: (_) => MapSelectionScreen(initialLocation: _shopLocation),
                          ),
                        );
                        if (result != null) {
                          setState(() {
                            _shopLocation = result.location;
                            _addressCtrl.text = result.address;
                          });
                          if (mounted) GlassToast.success(context, 'Location pinned successfully!');
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.surface,
                          borderRadius: BorderRadius.circular(kSharpRadius),
                          border: Border.all(color: AppColors.primary.withValues(alpha: 0.5)),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.map, color: AppColors.primary),
                                const SizedBox(width: 12),
                                Text('Pin Location on Map', style: TextStyle(fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface)),
                              ],
                            ),
                            Icon(Icons.chevron_right, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5)),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    FilledButton(
                      onPressed: _isSaving ? null : _saveProfile,
                      style: FilledButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 20),
                        backgroundColor: AppColors.primary,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(kSharpRadius)),
                      ),
                      child: _isSaving 
                          ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Text('SAVE SETTINGS', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1.5, color: Colors.white)),
                    ),
                    const SizedBox(height: 80), // Padding for navbar
                  ],
                ),
              ),
            ),
    );
  }
}
