import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import 'package:mapcn_flutter/mapcn_flutter.dart';
import 'package:permission_handler/permission_handler.dart';
import '../theme/glass_theme.dart';
import 'glass_toast.dart';

/// A floating "Locate Me" button that centers the map on the user's current GPS position.
///
/// Usage:
/// ```dart
/// LocateMeButton(
///   mapController: _mapController,
///   onLocated: (position) {
///     setState(() => _selectedLocation = LatLng(position.latitude, position.longitude));
///   },
/// )
/// ```
class LocateMeButton extends StatefulWidget {
  final MapcnController? mapController;

  /// Called with the resolved [Position] after a successful locate.
  final void Function(Position position)? onLocated;

  /// Zoom level to fly to (default 16).
  final double zoom;

  const LocateMeButton({
    Key? key,
    this.mapController,
    this.onLocated,
    this.zoom = 16,
  }) : super(key: key);

  @override
  State<LocateMeButton> createState() => _LocateMeButtonState();
}

class _LocateMeButtonState extends State<LocateMeButton> {
  bool _loading = false;

  Future<void> _locate() async {
    if (_loading) return;
    setState(() => _loading = true);

    try {
      // Check / request permission
      PermissionStatus status = await Permission.location.status;
      if (status.isDenied) {
        status = await Permission.location.request();
      }

      if (status.isPermanentlyDenied) {
        if (mounted) {
          GlassToast.error(
            context,
            'Location access is permanently denied. Enable it in Settings.',
          );
          await openAppSettings();
        }
        return;
      }

      if (!status.isGranted) {
        if (mounted) {
          GlassToast.error(context, 'Location permission denied.');
        }
        return;
      }

      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      if (!mounted) return;

      final loc = LatLng(position.latitude, position.longitude);
      widget.mapController?.flyTo(loc, zoom: widget.zoom);
      widget.onLocated?.call(position);
    } catch (e) {
      if (mounted) {
        GlassToast.error(context, 'Could not get location: $e');
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return GestureDetector(
      onTap: _locate,
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: isDark
              ? Colors.black.withValues(alpha: 0.82)
              : Colors.white.withValues(alpha: 0.95),
          shape: BoxShape.circle,
          border: Border.all(
            color: AppColors.primary.withValues(alpha: 0.4),
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.25),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: _loading
            ? Padding(
                padding: const EdgeInsets.all(11),
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: AppColors.primary,
                ),
              )
            : const Icon(Icons.my_location, color: AppColors.primary, size: 22),
      ),
    );
  }
}
