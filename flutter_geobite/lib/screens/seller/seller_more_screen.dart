import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../theme/glass_theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../main.dart';
import '../../models/vendor.dart';
import '../../services/vendor_service.dart';
import '../../services/order_service.dart';
import 'seller_promotions_screen.dart';
import 'seller_reviews_screen.dart';
import 'seller_analytics_screen.dart';
import 'seller_shop_screen.dart';
import 'seller_pos_screen.dart';
import 'seller_wallet_screen.dart';

class SellerMoreScreen extends StatefulWidget {
  const SellerMoreScreen({Key? key}) : super(key: key);

  @override
  _SellerMoreScreenState createState() => _SellerMoreScreenState();
}

class _SellerMoreScreenState extends State<SellerMoreScreen> {
  Vendor? _vendor;
  int _totalOrders = 0;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final vendors = await vendorService.getVendors();
      final myVendor = vendors.firstWhere((v) => v.userId == auth.user?.id);
      
      final orders = await orderService.getOrders();
      
      if (mounted) {
        setState(() {
          _vendor = myVendor;
          _totalOrders = orders.length;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final themeProvider = Provider.of<ThemeProvider>(context);
    final isDark = themeProvider.themeMode == ThemeMode.dark;

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text('Profile', style: TextStyle(fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface)),
        actions: [
          IconButton(
            icon: Icon(Icons.settings_outlined, color: Theme.of(context).colorScheme.onSurface),
            onPressed: () {},
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              children: [
                // Profile Card
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Theme.of(context).brightness == Brightness.dark 
                        ? const Color(0xFF1A1A1A) 
                        : Colors.white.withValues(alpha: 0.8),
                    borderRadius: BorderRadius.circular(kSharpRadius),
                  ),
                  child: Column(
                    children: [
                      CircleAvatar(
                        radius: 40,
                        backgroundColor: AppColors.primary.withValues(alpha: 0.2),
                        backgroundImage: _vendor?.imageUrl != null ? NetworkImage(_vendor!.imageUrl!) : null,
                        child: _vendor?.imageUrl == null
                            ? const Icon(Icons.storefront, size: 40, color: AppColors.primary)
                            : null,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        _vendor?.name ?? 'Setup Store Profile',
                        style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        auth.user?.email ?? '',
                        style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                
                // Stats Row
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: Theme.of(context).brightness == Brightness.dark 
                              ? const Color(0xFF1A1A1A) 
                              : Colors.white.withValues(alpha: 0.8),
                          borderRadius: BorderRadius.circular(kSharpRadius),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.shopping_bag_outlined, color: Colors.blue),
                            const SizedBox(height: 12),
                            Text('$_totalOrders', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 4),
                            Text('Total Orders', style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6))),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: Theme.of(context).brightness == Brightness.dark 
                              ? const Color(0xFF1A1A1A) 
                              : Colors.white.withValues(alpha: 0.8),
                          borderRadius: BorderRadius.circular(kSharpRadius),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.star_border, color: Colors.orange),
                            const SizedBox(height: 12),
                            Text(_vendor?.rating.toStringAsFixed(1) ?? 'N/A', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 4),
                            Text('Store Rating', style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6))),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 32),
                
                // STORE MANAGEMENT Section
                Text('STORE MANAGEMENT', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5))),
                const SizedBox(height: 12),
                Container(
                  decoration: BoxDecoration(
                    color: Theme.of(context).brightness == Brightness.dark 
                        ? const Color(0xFF1A1A1A) 
                        : Colors.white.withValues(alpha: 0.8),
                    borderRadius: BorderRadius.circular(kSharpRadius),
                  ),
                  child: Column(
                    children: [
                      _buildListItem(context, Icons.storefront_outlined, 'Shop Settings', const SellerShopScreen()),
                      Divider(height: 1, indent: 56, endIndent: 16, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.1)),
                      _buildListItem(context, Icons.point_of_sale, 'Point of Sale (POS)', const SellerPosScreen()),
                      Divider(height: 1, indent: 56, endIndent: 16, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.1)),
                      _buildListItem(context, Icons.account_balance_wallet_outlined, 'GeoPay Wallet', const SellerWalletScreen()),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                
                // PERFORMANCE Section
                Text('PERFORMANCE', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5))),
                const SizedBox(height: 12),
                Container(
                  decoration: BoxDecoration(
                    color: Theme.of(context).brightness == Brightness.dark 
                        ? const Color(0xFF1A1A1A) 
                        : Colors.white.withValues(alpha: 0.8),
                    borderRadius: BorderRadius.circular(kSharpRadius),
                  ),
                  child: Column(
                    children: [
                      _buildListItem(context, Icons.analytics_outlined, 'Analytics', const SellerAnalyticsScreen()),
                      Divider(height: 1, indent: 56, endIndent: 16, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.1)),
                      _buildListItem(context, Icons.star_border, 'Reviews', const SellerReviewsScreen()),
                      Divider(height: 1, indent: 56, endIndent: 16, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.1)),
                      _buildListItem(context, Icons.campaign_outlined, 'Promotions', const SellerPromotionsScreen()),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // PREFERENCES Section
                Text('PREFERENCES', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5))),
                const SizedBox(height: 12),
                Container(
                  decoration: BoxDecoration(
                    color: Theme.of(context).brightness == Brightness.dark 
                        ? const Color(0xFF1A1A1A) 
                        : Colors.white.withValues(alpha: 0.8),
                    borderRadius: BorderRadius.circular(kSharpRadius),
                  ),
                  child: Column(
                    children: [
                      ListTile(
                        leading: const Icon(Icons.dark_mode_outlined),
                        title: const Text('Dark Mode', style: TextStyle(fontWeight: FontWeight.bold)),
                        trailing: Switch(
                          value: isDark,
                          onChanged: (val) => themeProvider.toggleTheme(),
                          activeColor: AppColors.primary,
                        ),
                      ),
                      Divider(height: 1, indent: 56, endIndent: 16, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.1)),
                      _buildListItem(context, Icons.notifications_none_outlined, 'Notifications', null),
                      Divider(height: 1, indent: 56, endIndent: 16, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.1)),
                      _buildListItem(context, Icons.help_outline, 'Help & Support', null),
                    ],
                  ),
                ),
                const SizedBox(height: 32),
                
                OutlinedButton.icon(
                  onPressed: () async {
                    await auth.signOut();
                    if (mounted) {
                      Navigator.of(context).pushAndRemoveUntil(
                        MaterialPageRoute(builder: (_) => const AuthWrapper()),
                        (route) => false,
                      );
                    }
                  },
                  icon: const Icon(Icons.logout, color: Colors.red),
                  label: const Text('Sign Out', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 16)),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    backgroundColor: Colors.red.withValues(alpha: 0.15),
                    side: BorderSide.none,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(kSharpRadius)),
                  ),
                ),
                const SizedBox(height: 100), // padding for bottom nav
              ],
            ),
    );
  }

  Widget _buildListItem(BuildContext context, IconData icon, String title, Widget? screen) {
    return ListTile(
      onTap: screen != null ? () => Navigator.push(context, MaterialPageRoute(builder: (_) => screen)) : null,
      leading: Icon(icon, color: Theme.of(context).colorScheme.onSurface),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
      trailing: const Icon(Icons.chevron_right),
    );
  }
}
