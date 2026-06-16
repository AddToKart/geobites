import 'package:flutter/material.dart';
import '../../theme/glass_theme.dart';

class SellerAnalyticsScreen extends StatelessWidget {
  const SellerAnalyticsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: Text('Analytics', style: TextStyle(fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.only(left: 16, right: 16, top: 16, bottom: 100),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // KPI Cards Row
            Row(
              children: [
                Expanded(child: _buildKpiCard(context, 'Total Sales', '₱45,230', Icons.attach_money, AppColors.primary)),
                const SizedBox(width: 16),
                Expanded(child: _buildKpiCard(context, 'Total Orders', '342', Icons.receipt_long, Colors.blue)),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(child: _buildKpiCard(context, 'Average Value', '₱132.25', Icons.calculate, Colors.purple)),
                const SizedBox(width: 16),
                Expanded(child: _buildKpiCard(context, 'Active Views', '1.2k', Icons.visibility, Colors.green)),
              ],
            ),
            
            const SizedBox(height: 32),
            Text('Sales This Week', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface)),
            const SizedBox(height: 16),
            
            // Custom Bar Chart
            NeumorphicCard(
              padding: const EdgeInsets.all(20),
              child: SizedBox(
                height: 200,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    _buildBar(context, 'Mon', 0.4),
                    _buildBar(context, 'Tue', 0.6),
                    _buildBar(context, 'Wed', 0.5),
                    _buildBar(context, 'Thu', 0.8),
                    _buildBar(context, 'Fri', 1.0, isHighlight: true),
                    _buildBar(context, 'Sat', 0.9),
                    _buildBar(context, 'Sun', 0.7),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 32),
            Text('Top Selling Items', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface)),
            const SizedBox(height: 16),
            
            // Top Items List
            _buildTopItemCard(context, '1', 'Chicken Arroz Caldo', '124 orders', '₱16,120'),
            const SizedBox(height: 8),
            _buildTopItemCard(context, '2', 'Spanish Latte', '89 orders', '₱9,345'),
            const SizedBox(height: 8),
            _buildTopItemCard(context, '3', 'Tapsilog Supreme', '65 orders', '₱9,425'),
          ],
        ),
      ),
    );
  }

  Widget _buildKpiCard(BuildContext context, String title, String value, IconData icon, Color color) {
    return NeumorphicCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(icon, color: color, size: 24),
              Icon(Icons.trending_up, color: Colors.green.withValues(alpha: 0.8), size: 16),
            ],
          ),
          const SizedBox(height: 16),
          Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface)),
          const SizedBox(height: 4),
          Text(title, style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6))),
        ],
      ),
    );
  }

  Widget _buildBar(BuildContext context, String label, double heightFactor, {bool isHighlight = false}) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        Expanded(
          child: Align(
            alignment: Alignment.bottomCenter,
            child: FractionallySizedBox(
              heightFactor: heightFactor,
              child: Container(
                width: 24,
                decoration: BoxDecoration(
                  gradient: isHighlight ? AppColors.primaryGradient : null,
                  color: isHighlight ? null : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(kSharpRadius),
                  boxShadow: isHighlight 
                      ? [BoxShadow(color: AppColors.primary.withValues(alpha: 0.4), blurRadius: 8, offset: const Offset(0, 4))] 
                      : null,
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(label, style: TextStyle(fontSize: 12, fontWeight: isHighlight ? FontWeight.bold : FontWeight.normal, color: isHighlight ? AppColors.primary : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6))),
      ],
    );
  }

  Widget _buildTopItemCard(BuildContext context, String rank, String name, String orders, String revenue) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(kSharpRadius),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: rank == '1' ? Colors.amber.withValues(alpha: 0.2) : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: Text(rank, style: TextStyle(fontWeight: FontWeight.bold, color: rank == '1' ? Colors.amber : Theme.of(context).colorScheme.onSurface)),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                Text(orders, style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6))),
              ],
            ),
          ),
          Text(revenue, style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary, fontSize: 16)),
        ],
      ),
    );
  }
}
