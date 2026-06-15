import 'package:flutter/material.dart';
import '../../theme/glass_theme.dart';

class RiderEarningsScreen extends StatelessWidget {
  const RiderEarningsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Mock earnings data
    final earningsData = [
      {'date': 'Today', 'deliveries': 14, 'amount': 1250.00},
      {'date': 'Yesterday', 'deliveries': 22, 'amount': 1840.50},
      {'date': 'Oct 12, 2026', 'deliveries': 18, 'amount': 1520.00},
      {'date': 'Oct 11, 2026', 'deliveries': 25, 'amount': 2100.00},
      {'date': 'Oct 10, 2026', 'deliveries': 10, 'amount': 850.00},
    ];

    return GlassScaffold(
      appBar: const GlassAppBar(title: Text('Earnings History')),
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                children: [
                  NeumorphicCard(
                    glowColor: Colors.green,
                    useGradient: true,
                    child: const Padding(
                      padding: EdgeInsets.symmetric(vertical: 16.0),
                      child: Column(
                        children: [
                          Text('Total Earnings This Week', style: TextStyle(color: Colors.white70, fontSize: 16)),
                          SizedBox(height: 8),
                          Text('₱7,560.50', style: TextStyle(color: Colors.white, fontSize: 40, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),
                  const Align(
                    alignment: Alignment.centerLeft,
                    child: Text('Recent Payouts', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
                  ),
                ],
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final data = earningsData[index];
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
                              Text(data['date'] as String, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                              const SizedBox(height: 4),
                              Text('${data['deliveries']} Deliveries', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6))),
                            ],
                          ),
                          Text(
                            '₱${(data['amount'] as double).toStringAsFixed(2)}',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.green),
                          ),
                        ],
                      ),
                    ),
                  );
                },
                childCount: earningsData.length,
              ),
            ),
          ),
          const SliverPadding(padding: EdgeInsets.only(bottom: 40)),
        ],
      ),
    );
  }
}
