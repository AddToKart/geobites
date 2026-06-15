import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../theme/glass_theme.dart';
import '../../providers/auth_provider.dart';
import 'seller_promotions_screen.dart';
import 'seller_reviews_screen.dart';
import 'seller_analytics_screen.dart';
import 'seller_shop_screen.dart';

class SellerMoreScreen extends StatelessWidget {
  const SellerMoreScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: GlassAppBar(title: const Text('More Options')),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        children: [
          _buildMoreItem(context, Icons.campaign_outlined, 'Promotions', const SellerPromotionsScreen()),
          const SizedBox(height: 8),
          _buildMoreItem(context, Icons.star_border, 'Reviews', const SellerReviewsScreen()),
          const SizedBox(height: 8),
          _buildMoreItem(context, Icons.analytics_outlined, 'Analytics', const SellerAnalyticsScreen()),
          const Divider(height: 32),
          _buildMoreItem(context, Icons.storefront_outlined, 'Shop Settings', const SellerShopScreen()),
          const SizedBox(height: 8),
          ListTile(
            onTap: () => Provider.of<AuthProvider>(context, listen: false).signOut(),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            tileColor: Colors.red.withValues(alpha: 0.1),
            leading: const Icon(Icons.logout, color: Colors.red),
            title: const Text('Sign Out', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
            trailing: const Icon(Icons.chevron_right, color: Colors.red),
          ),
        ],
      ),
    );
  }

  Widget _buildMoreItem(BuildContext context, IconData icon, String title, Widget screen) {
    return ListTile(
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => screen)),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      tileColor: Theme.of(context).colorScheme.surface,
      leading: Icon(icon, color: AppColors.primary),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
      trailing: const Icon(Icons.chevron_right),
    );
  }
}
