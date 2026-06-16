import 'dart:async';
import 'package:flutter/material.dart';
import '../../models/vendor.dart';
import '../../services/vendor_service.dart';
import '../../theme/glass_theme.dart';
import 'glass_toast.dart';

/// Utility: checks if a vendor is currently open based on operatingHours and isTemporarilyClosed.
class ShopOpenStatus {
  final bool isScheduledOpen;
  final bool isTemporarilyClosed;
  final String todayLabel;
  final String scheduleText;

  const ShopOpenStatus({
    required this.isScheduledOpen,
    required this.isTemporarilyClosed,
    required this.todayLabel,
    required this.scheduleText,
  });

  /// True when the shop is effectively accepting orders.
  bool get isEffectivelyOpen => isScheduledOpen && !isTemporarilyClosed;

  static ShopOpenStatus compute(Vendor? vendor) {
    if (vendor == null) {
      return const ShopOpenStatus(
        isScheduledOpen: false,
        isTemporarilyClosed: false,
        todayLabel: '--',
        scheduleText: 'No schedule set',
      );
    }

    final now = DateTime.now();
    final todayWeekday = now.weekday % 7; // DateTime.monday = 1..7, we need 0=Sun..6=Sat

    final dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    final todayLabel = dayNames[todayWeekday];

    final hours = vendor.operatingHours;
    if (hours == null || hours.isEmpty) {
      return ShopOpenStatus(
        isScheduledOpen: vendor.isActive,
        isTemporarilyClosed: vendor.isTemporarilyClosed,
        todayLabel: todayLabel,
        scheduleText: 'No schedule configured',
      );
    }

    final todayHours = hours.firstWhere(
      (h) => h.dayOfWeek == todayWeekday,
      orElse: () => OperatingHour(dayOfWeek: todayWeekday, openTime: '00:00', closeTime: '00:00', isClosed: true),
    );

    if (todayHours.isClosed) {
      return ShopOpenStatus(
        isScheduledOpen: false,
        isTemporarilyClosed: vendor.isTemporarilyClosed,
        todayLabel: todayLabel,
        scheduleText: 'Closed today',
      );
    }

    // Parse open and close times
    final openParts = todayHours.openTime.split(':');
    final closeParts = todayHours.closeTime.split(':');
    final openDt = DateTime(now.year, now.month, now.day, int.parse(openParts[0]), int.parse(openParts[1]));
    final closeDt = DateTime(now.year, now.month, now.day, int.parse(closeParts[0]), int.parse(closeParts[1]));

    final isScheduledOpen = vendor.isActive && now.isAfter(openDt) && now.isBefore(closeDt);

    final scheduleText = '${_formatTime(todayHours.openTime)} – ${_formatTime(todayHours.closeTime)}';

    return ShopOpenStatus(
      isScheduledOpen: isScheduledOpen,
      isTemporarilyClosed: vendor.isTemporarilyClosed,
      todayLabel: todayLabel,
      scheduleText: scheduleText,
    );
  }

  static String _formatTime(String hhmm) {
    final parts = hhmm.split(':');
    final h = int.tryParse(parts[0]) ?? 0;
    final m = int.tryParse(parts[1]) ?? 0;
    final period = h < 12 ? 'AM' : 'PM';
    final displayH = h == 0 ? 12 : (h > 12 ? h - 12 : h);
    return '$displayH:${m.toString().padLeft(2, '0')} $period';
  }
}

/// A self-contained card that shows the current shop open/closed status and
/// provides a manual "Temporarily Closed" override toggle.
///
/// Usage: drop it into any seller screen that has access to a [Vendor] object.
class ShopStatusCard extends StatefulWidget {
  final Vendor vendor;
  final VoidCallback? onStatusChanged;

  const ShopStatusCard({
    Key? key,
    required this.vendor,
    this.onStatusChanged,
  }) : super(key: key);

  @override
  State<ShopStatusCard> createState() => _ShopStatusCardState();
}

class _ShopStatusCardState extends State<ShopStatusCard> {
  late Vendor _vendor;
  late ShopOpenStatus _status;
  Timer? _clockTimer;
  bool _isToggling = false;

  @override
  void initState() {
    super.initState();
    _vendor = widget.vendor;
    _status = ShopOpenStatus.compute(_vendor);

    // Refresh status every 60 seconds so the card updates automatically
    _clockTimer = Timer.periodic(const Duration(seconds: 60), (_) {
      if (mounted) {
        setState(() {
          _status = ShopOpenStatus.compute(_vendor);
        });
      }
    });
  }

  @override
  void didUpdateWidget(ShopStatusCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.vendor != oldWidget.vendor) {
      _vendor = widget.vendor;
      setState(() {
        _status = ShopOpenStatus.compute(_vendor);
      });
    }
  }

  @override
  void dispose() {
    _clockTimer?.cancel();
    super.dispose();
  }

  Future<void> _toggleTemporarilyClosed() async {
    if (_isToggling) return;
    setState(() => _isToggling = true);

    final newValue = !_vendor.isTemporarilyClosed;
    try {
      final updated = await vendorService.updateVendor(
        _vendor.id,
        {'isTemporarilyClosed': newValue},
      );
      setState(() {
        _vendor = updated;
        _status = ShopOpenStatus.compute(updated);
      });

      if (mounted) {
        GlassToast.success(
          context,
          newValue ? 'Shop set to Temporarily Closed' : 'Shop is back Open',
        );
      }
      widget.onStatusChanged?.call();
    } catch (e) {
      if (mounted) GlassToast.error(context, 'Could not update shop status');
    } finally {
      if (mounted) setState(() => _isToggling = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final effectivelyOpen = _status.isEffectivelyOpen;
    final statusColor = effectivelyOpen ? const Color(0xFF22C55E) : Colors.red.shade400;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return NeumorphicCard(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // ── Status header ────────────────────────────────────────────────
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.12),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(kSharpRadius)),
            ),
            child: Row(
              children: [
                // Pulsing dot
                _PulseDot(color: statusColor),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        effectivelyOpen ? 'SHOP IS OPEN' : 'SHOP IS CLOSED',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                          letterSpacing: 1.2,
                          color: statusColor,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        _buildSubtitle(),
                        style: TextStyle(
                          fontSize: 11,
                          color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // ── Schedule row ────────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Row(
              children: [
                Icon(Icons.schedule, size: 15, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5)),
                const SizedBox(width: 8),
                Text(
                  '${_status.todayLabel}: ${_status.scheduleText}',
                  style: TextStyle(
                    fontSize: 12,
                    color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7),
                  ),
                ),
              ],
            ),
          ),

          const Divider(height: 1),

          // ── Manual override toggle ───────────────────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Temporarily Close Shop',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                          color: Theme.of(context).colorScheme.onSurface,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Pause orders without changing your schedule',
                        style: TextStyle(
                          fontSize: 11,
                          color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.55),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                _isToggling
                    ? const SizedBox(
                        width: 24, height: 24,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Switch(
                        value: _vendor.isTemporarilyClosed,
                        activeColor: Colors.red.shade400,
                        activeTrackColor: Colors.red.shade100,
                        inactiveThumbColor: const Color(0xFF22C55E),
                        inactiveTrackColor: const Color(0xFF22C55E).withValues(alpha: 0.25),
                        onChanged: (_) => _toggleTemporarilyClosed(),
                      ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _buildSubtitle() {
    if (!_vendor.isActive) return 'Shop is deactivated';
    if (_vendor.isTemporarilyClosed) return 'Manually paused — toggle to reopen';
    if (!_status.isScheduledOpen) return 'Outside scheduled hours';
    return 'Accepting orders now';
  }
}

/// Animated pulsing dot indicator.
class _PulseDot extends StatefulWidget {
  final Color color;
  const _PulseDot({required this.color});

  @override
  State<_PulseDot> createState() => _PulseDotState();
}

class _PulseDotState extends State<_PulseDot> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(seconds: 1))
      ..repeat(reverse: true);
    _anim = Tween<double>(begin: 0.4, end: 1.0).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _anim,
      child: Container(
        width: 10,
        height: 10,
        decoration: BoxDecoration(color: widget.color, shape: BoxShape.circle),
      ),
    );
  }
}
