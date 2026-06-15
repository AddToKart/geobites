import 'package:flutter/material.dart';
import '../../theme/glass_theme.dart';
import '../../widgets/glass_toast.dart';

class RiderVehicleScreen extends StatefulWidget {
  const RiderVehicleScreen({Key? key}) : super(key: key);

  @override
  _RiderVehicleScreenState createState() => _RiderVehicleScreenState();
}

class _RiderVehicleScreenState extends State<RiderVehicleScreen> {
  String _selectedVehicle = 'Motorcycle';
  bool _hasImage = false;
  final _modelController = TextEditingController(text: 'Yamaha NMAX');
  final _plateController = TextEditingController(text: 'ABC-1234');
  bool _isSaving = false;

  void _uploadImage() {
    // Simulate picking an image
    setState(() => _hasImage = true);
  }

  void _saveDetails() async {
    setState(() => _isSaving = true);
    await Future.delayed(const Duration(seconds: 1));
    if (mounted) {
      setState(() => _isSaving = false);
      GlassToast.success(context, 'Vehicle details updated!');
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return GlassScaffold(
      appBar: const GlassAppBar(title: Text('Vehicle Details')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Vehicle Type', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildVehicleToggle('Motorcycle', Icons.two_wheeler),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildVehicleToggle('Car', Icons.directions_car),
                ),
              ],
            ),
            const SizedBox(height: 32),
            
            const Text('Vehicle Model', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 12),
            TextField(
              controller: _modelController,
              decoration: InputDecoration(
                filled: true,
                fillColor: Theme.of(context).colorScheme.surface,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                prefixIcon: const Icon(Icons.motorcycle),
                hintText: 'e.g., Yamaha NMAX, Toyota Vios',
              ),
            ),
            const SizedBox(height: 32),
            
            const Text('License Plate', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 12),
            TextField(
              controller: _plateController,
              decoration: InputDecoration(
                filled: true,
                fillColor: Theme.of(context).colorScheme.surface,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                prefixIcon: const Icon(Icons.pin),
              ),
            ),
            const SizedBox(height: 32),

            const Text('Vehicle Photo', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 12),
            GestureDetector(
              onTap: _uploadImage,
              child: Container(
                height: 200,
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: AppColors.primary.withValues(alpha: 0.5), width: 2),
                  image: _hasImage
                      ? DecorationImage(
                          image: NetworkImage(
                            _selectedVehicle == 'Motorcycle'
                                ? 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80'
                                : 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
                          ),
                          fit: BoxFit.cover,
                        )
                      : null,
                ),
                child: _hasImage
                    ? Stack(
                        children: [
                          Positioned(
                            top: 16,
                            right: 16,
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: const BoxDecoration(color: Colors.green, shape: BoxShape.circle),
                              child: const Icon(Icons.check, color: Colors.white),
                            ),
                          ),
                        ],
                      )
                    : const Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.add_a_photo, size: 64, color: AppColors.primary),
                          SizedBox(height: 16),
                          Text('Tap to Upload Photo', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
                        ],
                      ),
              ),
            ),
            if (_hasImage) ...[
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: () => setState(() => _hasImage = false),
                icon: const Icon(Icons.refresh),
                label: const Text('Change Photo'),
                style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
              ),
            ],
            
            const SizedBox(height: 48),
            FilledButton(
              onPressed: _isSaving ? null : _saveDetails,
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                backgroundColor: AppColors.primary,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: _isSaving
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text('Save Details', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVehicleToggle(String type, IconData icon) {
    final isSelected = _selectedVehicle == type;
    return GestureDetector(
      onTap: () => setState(() {
        _selectedVehicle = type;
        _hasImage = false; // reset image when changing type for mockup purposes
      }),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 24),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary.withValues(alpha: 0.2) : Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: isSelected ? AppColors.primary : Colors.transparent, width: 2),
        ),
        child: Column(
          children: [
            Icon(icon, size: 48, color: isSelected ? AppColors.primary : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5)),
            const SizedBox(height: 12),
            Text(type, style: TextStyle(fontWeight: FontWeight.bold, color: isSelected ? AppColors.primary : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5))),
          ],
        ),
      ),
    );
  }
}
