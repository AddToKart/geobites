import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../theme/glass_theme.dart';
import 'rider_vehicle_screen.dart';
import 'rider_earnings_screen.dart';
import '../customer/wallet_screen.dart';

class RiderProfileScreen extends StatelessWidget {
  const RiderProfileScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user;

    return GlassScaffold(
      appBar: AppBar(
        title: Text('Profile', style: TextStyle(fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(Icons.settings_outlined, color: Theme.of(context).colorScheme.onSurface),
            onPressed: () {}, // Future settings
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 16),
              
              // Profile Header Card
              NeumorphicCard(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  children: [
                    Stack(
                      alignment: Alignment.bottomRight,
                      children: [
                        CircleAvatar(
                          radius: 48,
                          backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                          child: const Icon(Icons.two_wheeler, size: 48, color: AppColors.primary),
                        ),
                        Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                            color: Colors.green,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.check, size: 16, color: Colors.white),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      user?.name ?? 'Rider Name',
                      style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      user?.email ?? 'rider@geobites.com',
                      style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6)),
                    ),
                    if (user?.phone != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        user!.phone!,
                        style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6)),
                      ),
                    ],
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text('Top Rated Rider', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 12)),
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 24),
              
              // Stats Row
              Row(
                children: [
                  Expanded(
                    child: _buildStatCard(context, 'Total Deliveries', '124', Icons.local_shipping_outlined, Colors.blue),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: _buildStatCard(context, 'Rating', '4.9', Icons.star_border, Colors.orange),
                  ),
                ],
              ),
              
              const SizedBox(height: 24),
              
              // Settings & Options
              const Text('ACCOUNT', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.5, color: Colors.grey)),
              const SizedBox(height: 12),
              NeumorphicCard(
                padding: EdgeInsets.zero,
                child: Column(
                  children: [
                    _buildListTile(context, Icons.person_outline, 'Personal Information'),
                    const Divider(height: 1, indent: 56),
                    _buildListTile(context, Icons.two_wheeler_outlined, 'Vehicle Details', destination: const RiderVehicleScreen()),
                    const Divider(height: 1, indent: 56),
                    _buildListTile(context, Icons.account_balance_wallet_outlined, 'Earnings History', destination: const RiderEarningsScreen()),
                    const Divider(height: 1, indent: 56),
                    _buildListTile(context, Icons.payment_outlined, 'GeoPay Wallet', destination: const WalletScreen()),
                  ],
                ),
              ),
              
              const SizedBox(height: 24),
              
              const Text('PREFERENCES', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.5, color: Colors.grey)),
              const SizedBox(height: 12),
              NeumorphicCard(
                padding: EdgeInsets.zero,
                child: Column(
                  children: [
                    ListTile(
                      leading: Icon(
                        Theme.of(context).brightness == Brightness.dark ? Icons.dark_mode_outlined : Icons.light_mode_outlined,
                        color: Theme.of(context).colorScheme.onSurface,
                      ),
                      title: const Text('Dark Mode', style: TextStyle(fontWeight: FontWeight.w600)),
                      trailing: Switch(
                        value: Theme.of(context).brightness == Brightness.dark,
                        onChanged: (_) => Provider.of<ThemeProvider>(context, listen: false).toggleTheme(),
                        activeColor: AppColors.primary,
                      ),
                    ),
                    const Divider(height: 1, indent: 56),
                    _buildListTile(context, Icons.notifications_outlined, 'Notifications'),
                    const Divider(height: 1, indent: 56),
                    _buildListTile(context, Icons.help_outline, 'Help & Support'),
                  ],
                ),
              ),
              
              const SizedBox(height: 32),
              
              // Sign Out Button
              OutlinedButton.icon(
                icon: const Icon(Icons.logout, color: Colors.red),
                label: const Text('Sign Out', style: TextStyle(color: Colors.red, fontSize: 16, fontWeight: FontWeight.bold)),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Colors.red),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                onPressed: () => auth.signOut(),
              ),
              
              const SizedBox(height: 120), // Bottom padding for floating nav bar
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(BuildContext context, String title, String value, IconData icon, Color color) {
    return NeumorphicCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color),
          const SizedBox(height: 12),
          Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(title, style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6))),
        ],
      ),
    );
  }

  Widget _buildListTile(BuildContext context, IconData icon, String title, {Widget? destination}) {
    return ListTile(
      leading: Icon(icon, color: Theme.of(context).colorScheme.onSurface),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
      trailing: const Icon(Icons.chevron_right),
      onTap: destination != null
          ? () => Navigator.push(context, MaterialPageRoute(builder: (_) => destination))
          : () {}, // Future placeholder
    );
  }
}
