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
import '../../widgets/shop_status_card.dart';
import '../customer/map_selection_screen.dart';
import 'seller_main_screen.dart';
import '../../core/api_client.dart';

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

  // Weekly operating schedule state: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  final Map<int, Map<String, dynamic>> _schedule = {
    1: {'openTime': '08:00', 'closeTime': '17:00', 'isClosed': false}, // Monday
    2: {'openTime': '08:00', 'closeTime': '17:00', 'isClosed': false}, // Tuesday
    3: {'openTime': '08:00', 'closeTime': '17:00', 'isClosed': false}, // Wednesday
    4: {'openTime': '08:00', 'closeTime': '17:00', 'isClosed': false}, // Thursday
    5: {'openTime': '08:00', 'closeTime': '17:00', 'isClosed': false}, // Friday
    6: {'openTime': '08:00', 'closeTime': '17:00', 'isClosed': true},  // Saturday
    0: {'openTime': '08:00', 'closeTime': '17:00', 'isClosed': true},  // Sunday
  };

  String _formatTimeOfState(String timeStr) {
    try {
      final parts = timeStr.split(':');
      final hour = int.parse(parts[0]);
      final minute = int.parse(parts[1]);
      final timeOfDay = TimeOfDay(hour: hour, minute: minute);
      
      final hourOfPeriod = timeOfDay.hourOfPeriod == 0 ? 12 : timeOfDay.hourOfPeriod;
      final period = timeOfDay.period == DayPeriod.am ? 'AM' : 'PM';
      final minuteStr = timeOfDay.minute.toString().padLeft(2, '0');
      return '$hourOfPeriod:$minuteStr $period';
    } catch (e) {
      return timeStr;
    }
  }

  Future<void> _selectTime(int day, bool isOpenTime) async {
    final currentVal = _schedule[day]![isOpenTime ? 'openTime' : 'closeTime'] as String;
    final parts = currentVal.split(':');
    final initialTime = TimeOfDay(hour: int.parse(parts[0]), minute: int.parse(parts[1]));

    final picked = await showTimePicker(
      context: context,
      initialTime: initialTime,
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: Theme.of(context).colorScheme.copyWith(
              primary: AppColors.primary,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      final formatted = '${picked.hour.toString().padLeft(2, '0')}:${picked.minute.toString().padLeft(2, '0')}';
      setState(() {
        _schedule[day]![isOpenTime ? 'openTime' : 'closeTime'] = formatted;
      });
    }
  }

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
        if (myVendor.operatingHours != null && myVendor.operatingHours!.isNotEmpty) {
          for (var oh in myVendor.operatingHours!) {
            _schedule[oh.dayOfWeek] = {
              'openTime': oh.openTime,
              'closeTime': oh.closeTime,
              'isClosed': oh.isClosed,
            };
          }
        }
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
        'openTime': _schedule[1]?['openTime'] ?? '08:00',
        'closeTime': _schedule[1]?['closeTime'] ?? '17:00',
        'operatingHours': _schedule.entries.map((e) => {
          'dayOfWeek': e.key,
          'openTime': e.value['openTime'],
          'closeTime': e.value['closeTime'],
          'isClosed': e.value['isClosed'],
        }).toList(),
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
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Shop status card — always visible at the top
                  if (_vendor != null) ...[  
                    ShopStatusCard(
                      vendor: _vendor!,
                      onStatusChanged: _loadData,
                    ),
                    const SizedBox(height: 16),
                  ],
                  NeumorphicCard(
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
                                  ? DecorationImage(
                                      image: NetworkImage(_existingCoverUrl!.startsWith('http')
                                          ? _existingCoverUrl!
                                          : "${ApiClient.socketUrl}$_existingCoverUrl"),
                                      fit: BoxFit.cover)
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
                    const SizedBox(height: 32),
                    const Divider(),
                    const SizedBox(height: 16),
                    const Text('Store Schedule', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                    const SizedBox(height: 16),
                    ...[1, 2, 3, 4, 5, 6, 0].map((day) {
                      final dayData = _schedule[day]!;
                      final isClosed = dayData['isClosed'] as bool;
                      final openTime = dayData['openTime'] as String;
                      final closeTime = dayData['closeTime'] as String;
                      final dayName = day == 1 ? 'Monday'
                                    : day == 2 ? 'Tuesday'
                                    : day == 3 ? 'Wednesday'
                                    : day == 4 ? 'Thursday'
                                    : day == 5 ? 'Friday'
                                    : day == 6 ? 'Saturday'
                                    : 'Sunday';

                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: Theme.of(context).brightness == Brightness.dark 
                              ? Colors.white.withValues(alpha: 0.02) 
                              : Colors.black.withValues(alpha: 0.02),
                          borderRadius: BorderRadius.circular(kSharpRadius),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              flex: 3,
                              child: Text(
                                dayName,
                                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                              ),
                            ),
                            Switch(
                              value: !isClosed,
                              activeThumbColor: AppColors.primary,
                              onChanged: (val) {
                                setState(() {
                                  _schedule[day]!['isClosed'] = !val;
                                });
                              },
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              flex: 5,
                              child: isClosed
                                  ? const Center(
                                      child: Text(
                                        'Closed',
                                        style: TextStyle(
                                          color: Colors.grey,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    )
                                  : Row(
                                      children: [
                                        Expanded(
                                          child: TextButton(
                                            onPressed: () => _selectTime(day, true),
                                            style: TextButton.styleFrom(
                                              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                                              backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(kSharpRadius)),
                                            ),
                                            child: Text(
                                              _formatTimeOfState(openTime),
                                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primary),
                                              textAlign: TextAlign.center,
                                            ),
                                          ),
                                        ),
                                        const Padding(
                                          padding: EdgeInsets.symmetric(horizontal: 4.0),
                                          child: Text('to', style: TextStyle(fontSize: 11, color: Colors.grey)),
                                        ),
                                        Expanded(
                                          child: TextButton(
                                            onPressed: () => _selectTime(day, false),
                                            style: TextButton.styleFrom(
                                              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                                              backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(kSharpRadius)),
                                            ),
                                            child: Text(
                                              _formatTimeOfState(closeTime),
                                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primary),
                                              textAlign: TextAlign.center,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                            ),
                          ],
                        ),
                      );
                    }),
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
                ],
              ),
            ),
    );
  }
}
