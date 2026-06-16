import 'package:flutter/material.dart';
import '../../models/order.dart';
import '../../services/order_service.dart';
import '../../theme/glass_theme.dart';
import 'dart:async';
import '../../widgets/glass_toast.dart';

class RiderProofOfDeliveryScreen extends StatefulWidget {
  final Order order;

  const RiderProofOfDeliveryScreen({Key? key, required this.order}) : super(key: key);

  @override
  _RiderProofOfDeliveryScreenState createState() => _RiderProofOfDeliveryScreenState();
}

class _RiderProofOfDeliveryScreenState extends State<RiderProofOfDeliveryScreen> {
  bool _isCaptured = false;
  bool _isSubmitting = false;

  void _capturePhoto() {
    setState(() => _isSubmitting = true);
    // Simulate opening camera and capturing a photo
    Future.delayed(const Duration(seconds: 1), () {
      if (mounted) {
        setState(() {
          _isCaptured = true;
          _isSubmitting = false;
        });
      }
    });
  }

  Future<void> _submitDelivery() async {
    setState(() => _isSubmitting = true);
    try {
      await orderService.updateOrderStatus(widget.order.id, 'delivered');
      if (mounted) {
        // Show beautiful success dialog
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (_) => AlertDialog(
            backgroundColor: Theme.of(context).colorScheme.surface.withValues(alpha: 0.9),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
            content: const Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.check_circle, color: Colors.green, size: 80),
                SizedBox(height: 24),
                Text('Delivery Complete!', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                SizedBox(height: 8),
                Text('The seller and customer have been notified.', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey)),
              ],
            ),
          ),
        );
        
        await Future.delayed(const Duration(seconds: 2));
        if (mounted) {
          Navigator.of(context).popUntil((route) => route.isFirst); // Go back to Dashboard
        }
      }
    } catch (e) {
      if (mounted) {
        GlassToast.error(context, 'Failed to submit: $e');
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(
        title: const Text('Proof of Delivery', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Take a photo of the package at the drop-off location to confirm delivery.',
                style: TextStyle(fontSize: 16, color: Colors.grey),
              ),
              const SizedBox(height: 32),
              
              // Camera / Photo Area
              Expanded(
                child: GestureDetector(
                  onTap: _isCaptured ? null : _capturePhoto,
                  child: Container(
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(
                        color: _isCaptured ? Colors.green : AppColors.primary.withValues(alpha: 0.5),
                        width: 2,
                        style: BorderStyle.solid,
                      ),
                      image: _isCaptured
                          ? const DecorationImage(
                              // Using a nice stock image of a parcel at a door
                              image: NetworkImage('https://images.unsplash.com/photo-1580674285054-bed31e145f59?auto=format&fit=crop&q=80&w=800'),
                              fit: BoxFit.cover,
                            )
                          : null,
                    ),
                    child: _isSubmitting && !_isCaptured
                        ? const Center(child: CircularProgressIndicator())
                        : _isCaptured
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
                                  Icon(Icons.camera_alt, size: 64, color: AppColors.primary),
                                  SizedBox(height: 16),
                                  Text('Tap to Capture', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primary)),
                                ],
                              ),
                  ),
                ),
              ),
              
              const SizedBox(height: 24),
              
              if (_isCaptured)
                OutlinedButton.icon(
                  onPressed: () => setState(() => _isCaptured = false),
                  icon: const Icon(Icons.refresh),
                  label: const Text('Retake Photo'),
                  style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                ),
                
              const SizedBox(height: 32),
              
              FilledButton(
                onPressed: (_isCaptured && !_isSubmitting) ? _submitDelivery : null,
                style: FilledButton.styleFrom(
                  backgroundColor: Colors.green,
                  padding: const EdgeInsets.symmetric(vertical: 18),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: _isSubmitting && _isCaptured
                    ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('CONFIRM DELIVERY', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
