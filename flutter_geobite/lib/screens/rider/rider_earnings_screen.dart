import 'package:flutter/material.dart';
import '../../theme/glass_theme.dart';
import '../../services/wallet_service.dart';

class RiderEarningsScreen extends StatefulWidget {
  const RiderEarningsScreen({super.key});

  @override
  State<RiderEarningsScreen> createState() => _RiderEarningsScreenState();
}

class _RiderEarningsScreenState extends State<RiderEarningsScreen> {
  bool _loading = true;
  String? _error;
  double _weeklyTotal = 0.0;
  List<Map<String, dynamic>> _dailyEarnings = [];

  @override
  void initState() {
    super.initState();
    _loadEarnings();
  }

  Future<void> _loadEarnings() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await walletService.getRiderEarnings();
      setState(() {
        _weeklyTotal = double.tryParse(data['weeklyTotal'].toString()) ?? 0.0;
        final raw = data['dailyEarnings'] as List<dynamic>? ?? [];
        _dailyEarnings = raw.map((e) => Map<String, dynamic>.from(e as Map)).toList();
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return GlassScaffold(
      appBar: const GlassAppBar(title: Text('Earnings History')),
      body: RefreshIndicator(
        onRefresh: _loadEarnings,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  children: [
                    NeumorphicCard(
                      glowColor: Colors.green,
                      useGradient: true,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 16.0),
                        child: Column(
                          children: [
                            const Text(
                              'Total Earnings This Week',
                              style: TextStyle(color: Colors.white70, fontSize: 16),
                            ),
                            const SizedBox(height: 8),
                            _loading
                                ? const SizedBox(
                                    height: 48,
                                    child: Center(
                                      child: CircularProgressIndicator(color: Colors.white),
                                    ),
                                  )
                                : Text(
                                    '₱${_weeklyTotal.toStringAsFixed(2)}',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 40,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 32),
                    const Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'Recent Payouts',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Error state
            if (_error != null)
              SliverFillRemaining(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32.0),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.error_outline, size: 48, color: Colors.redAccent),
                        const SizedBox(height: 12),
                        Text(
                          _error!,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7),
                          ),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _loadEarnings,
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                ),
              )

            // Loading state (daily list)
            else if (_loading)
              const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator()),
              )

            // Empty state
            else if (_dailyEarnings.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32.0),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.account_balance_wallet_outlined,
                          size: 64,
                          color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'No earnings yet.\nComplete deliveries to start earning!',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              )

            // Real data
            else ...[
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final data = _dailyEarnings[index];
                      final amount = double.tryParse(data['amount'].toString()) ?? 0.0;
                      final deliveries = data['deliveries'] as int? ?? 0;
                      final date = data['date'] as String? ?? '';
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16.0),
                        child: NeumorphicCard(
                          padding: const EdgeInsets.all(20),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    date,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '$deliveries ${deliveries == 1 ? 'Delivery' : 'Deliveries'}',
                                    style: TextStyle(
                                      color: Theme.of(context)
                                          .colorScheme
                                          .onSurface
                                          .withValues(alpha: 0.6),
                                    ),
                                  ),
                                ],
                              ),
                              Text(
                                '₱${amount.toStringAsFixed(2)}',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 18,
                                  color: Colors.green,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                    childCount: _dailyEarnings.length,
                  ),
                ),
              ),
              const SliverPadding(padding: EdgeInsets.only(bottom: 40)),
            ],
          ],
        ),
      ),
    );
  }
}
