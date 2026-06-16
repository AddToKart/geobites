import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../models/order.dart';
import '../../services/order_service.dart';
import '../../theme/glass_theme.dart';
import '../../widgets/glass_toast.dart';

class RiderProofOfDeliveryScreen extends StatefulWidget {
  final Order order;

  const RiderProofOfDeliveryScreen({Key? key, required this.order})
      : super(key: key);

  @override
  _RiderProofOfDeliveryScreenState createState() =>
      _RiderProofOfDeliveryScreenState();
}

class _RiderProofOfDeliveryScreenState
    extends State<RiderProofOfDeliveryScreen> {
  File? _capturedPhoto;
  bool _isSubmitting = false;
  String? _permissionError;

  /// Opens the camera after requesting permission. Sets [_permissionError] if denied.
  Future<void> _capturePhoto() async {
    // Request camera permission
    final status = await Permission.camera.request();

    if (status.isDenied || status.isPermanentlyDenied) {
      setState(() {
        _permissionError = status.isPermanentlyDenied
            ? 'Camera access is permanently denied. Please enable it in your device settings.'
            : 'Camera permission is required to take a proof photo.';
      });
      return;
    }

    setState(() => _permissionError = null);

    try {
      final picker = ImagePicker();
      final XFile? photo =
          await picker.pickImage(source: ImageSource.camera, imageQuality: 80);

      if (photo != null && mounted) {
        setState(() => _capturedPhoto = File(photo.path));
      }
    } catch (e) {
      if (mounted) {
        GlassToast.error(context, 'Failed to open camera: $e');
      }
    }
  }

  /// Transitions the order through the correct status chain and confirms delivery.
  /// Backend flow: picked_up → delivering → delivered
  Future<void> _submitDelivery() async {
    setState(() => _isSubmitting = true);
    try {
      final currentStatus = widget.order.status;

      // If still in picked_up, advance to delivering first
      if (currentStatus == 'picked_up') {
        await orderService.updateOrderStatus(widget.order.id, 'delivering');
      }

      // Now mark as delivered
      await orderService.updateOrderStatus(widget.order.id, 'delivered');

      if (mounted) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (_) => AlertDialog(
            backgroundColor:
                Theme.of(context).colorScheme.surface.withValues(alpha: 0.95),
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(kSharpRadius)),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: const [
                Icon(Icons.check_circle, color: Colors.green, size: 80),
                SizedBox(height: 24),
                Text('Delivery Complete!',
                    style:
                        TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                SizedBox(height: 8),
                Text(
                  'The seller and customer have been notified.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey),
                ),
              ],
            ),
          ),
        );

        await Future.delayed(const Duration(seconds: 2));
        if (mounted) {
          Navigator.of(context).popUntil((route) => route.isFirst);
        }
      }
    } catch (e) {
      if (mounted) {
        // Show the actual error message cleanly — strip Dio boilerplate
        final raw = e.toString();
        String message = raw;
        // Extract the first meaningful sentence
        final match = RegExp(r'400[^\n]*\n([^\n]+)').firstMatch(raw);
        if (match != null) {
          message = match.group(1)?.trim() ?? raw;
        } else if (raw.contains('Exception:')) {
          message = raw.split('Exception:').last.trim();
        }
        GlassToast.error(context, message);
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(
        title: const Text('Proof of Delivery',
            style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Instructions
              Text(
                'Take a clear photo of the delivered package at the drop-off location.',
                style: TextStyle(
                    fontSize: 15,
                    color: Theme.of(context)
                        .colorScheme
                        .onSurface
                        .withValues(alpha: 0.65)),
              ),
              const SizedBox(height: 24),

              // ── Camera / Photo Preview Area ────────────────────────────────
              Expanded(
                child: GestureDetector(
                  onTap: _isSubmitting ? null : _capturePhoto,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    decoration: BoxDecoration(
                      color: isDark
                          ? Colors.white.withValues(alpha: 0.04)
                          : Colors.black.withValues(alpha: 0.04),
                      borderRadius: BorderRadius.circular(kSharpRadius),
                      border: Border.all(
                        color: _capturedPhoto != null
                            ? Colors.green
                            : _permissionError != null
                                ? Colors.red.withValues(alpha: 0.7)
                                : AppColors.primary.withValues(alpha: 0.5),
                        width: 2,
                      ),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: _capturedPhoto != null
                        // ── Real captured image ──────────────────────────────
                        ? Stack(
                            fit: StackFit.expand,
                            children: [
                              Image.file(_capturedPhoto!, fit: BoxFit.cover),
                              // Green confirmation badge
                              Positioned(
                                top: 16,
                                right: 16,
                                child: Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: const BoxDecoration(
                                      color: Colors.green,
                                      shape: BoxShape.circle),
                                  child: const Icon(Icons.check,
                                      color: Colors.white, size: 20),
                                ),
                              ),
                            ],
                          )
                        // ── Empty / error state ──────────────────────────────
                        : Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                _permissionError != null
                                    ? Icons.no_photography_outlined
                                    : Icons.camera_alt_outlined,
                                size: 72,
                                color: _permissionError != null
                                    ? Colors.red.withValues(alpha: 0.6)
                                    : AppColors.primary,
                              ),
                              const SizedBox(height: 16),
                              Text(
                                _permissionError != null
                                    ? 'Camera Permission Denied'
                                    : 'Tap to Open Camera',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: _permissionError != null
                                      ? Colors.red
                                      : AppColors.primary,
                                ),
                              ),
                              if (_permissionError != null) ...[
                                const SizedBox(height: 12),
                                Padding(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 32),
                                  child: Text(
                                    _permissionError!,
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontSize: 13,
                                      color: Theme.of(context)
                                          .colorScheme
                                          .onSurface
                                          .withValues(alpha: 0.55),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 16),
                                TextButton.icon(
                                  onPressed: openAppSettings,
                                  icon: const Icon(Icons.settings_outlined,
                                      size: 16),
                                  label: const Text('Open Settings'),
                                ),
                              ],
                            ],
                          ),
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // ── Retake button ──────────────────────────────────────────────
              if (_capturedPhoto != null)
                OutlinedButton.icon(
                  onPressed: _isSubmitting
                      ? null
                      : () => setState(() => _capturedPhoto = null),
                  icon: const Icon(Icons.refresh),
                  label: const Text('Retake Photo'),
                  style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14)),
                ),

              const SizedBox(height: 12),

              // ── Submit button ──────────────────────────────────────────────
              FilledButton(
                onPressed: (_capturedPhoto != null && !_isSubmitting)
                    ? _submitDelivery
                    : null,
                style: FilledButton.styleFrom(
                  backgroundColor: Colors.green,
                  padding: const EdgeInsets.symmetric(vertical: 18),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(kSharpRadius)),
                ),
                child: _isSubmitting
                    ? const SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(
                            color: Colors.white, strokeWidth: 2))
                    : const Text('CONFIRM DELIVERY',
                        style: TextStyle(
                            fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
