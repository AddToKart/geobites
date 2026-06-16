import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../theme/glass_theme.dart';
import '../../providers/notification_provider.dart';
import '../../widgets/glass_toast.dart';
import 'browse_screen.dart';
import 'customer_activity_screen.dart';
import '../../services/socket_service.dart';
import 'customer_profile_screen.dart';
import 'cart_screen.dart';
import 'wallet_screen.dart';
import '../../providers/auth_provider.dart';

class CustomerMainScreen extends StatefulWidget {
  const CustomerMainScreen({Key? key}) : super(key: key);

  @override
  _CustomerMainScreenState createState() => _CustomerMainScreenState();
}

class _CustomerMainScreenState extends State<CustomerMainScreen> {
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      if (auth.user != null) {
        Provider.of<NotificationProvider>(context, listen: false).initialize(
          auth.user!.id,
          onNotificationReceived: (notification) {
            GlassToast.show(
              context,
              notification['title'] ?? 'Notification',
              description: notification['message'] ?? '',
              icon: Icons.notifications_active,
              color: AppColors.primary,
            );
          },
        );
      }
    });
  }

  final List<Widget> _screens = [
    BrowseScreen(),
    CartScreen(),
    const CustomerActivityScreen(),
    const WalletScreen(),
    const CustomerProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return GlassScaffold(
      extendBody: true,
      body: Stack(
        children: [
          _screens[_currentIndex],
          StreamBuilder<bool>(
            stream: SocketService().connectionStateStream,
            initialData: SocketService().isConnected,
            builder: (context, snapshot) {
              final isConnected = snapshot.data ?? false;
              if (isConnected) return const SizedBox.shrink();
              
              return Positioned(
                top: MediaQuery.of(context).padding.top,
                left: 0,
                right: 0,
                child: Container(
                  width: double.infinity,
                  color: Colors.red.withValues(alpha: 0.8),
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: const Text(
                    'You are offline. Changes will be saved locally and synced later.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                  ),
                ),
              );
            },
          ),
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Theme.of(context).scaffoldBackgroundColor.withValues(alpha: 0.0),
                    Theme.of(context).scaffoldBackgroundColor.withValues(alpha: 0.8),
                    Theme.of(context).scaffoldBackgroundColor,
                  ],
                  stops: const [0.0, 0.6, 1.0],
                ),
              ),
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
                  child: Container(
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.surface.withOpacity(0.95), // Slightly transparent for glass effect
                      borderRadius: BorderRadius.circular(32),
                      border: Border.all(color: Theme.of(context).brightness == Brightness.dark ? Colors.white.withValues(alpha: 0.1) : Colors.black.withValues(alpha: 0.05)),
                      boxShadow: [
                        BoxShadow(
                          color: Theme.of(context).brightness == Brightness.dark ? Colors.black.withValues(alpha: 0.5) : AppColors.primary.withOpacity(0.15),
                          blurRadius: 30,
                          spreadRadius: 5,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(32),
                      child: BottomNavigationBar(
                        currentIndex: _currentIndex,
                        onTap: (index) => setState(() => _currentIndex = index),
                        backgroundColor: Colors.transparent,
                        elevation: 0,
                        selectedItemColor: AppColors.primary,
                        unselectedItemColor: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
                        selectedFontSize: 12,
                        unselectedFontSize: 12,
                        showSelectedLabels: true, // Show labels as requested
                        showUnselectedLabels: true,
                        type: BottomNavigationBarType.fixed,
                        items: const [
                          BottomNavigationBarItem(icon: Icon(Icons.home_outlined, size: 24), activeIcon: Icon(Icons.home, size: 24), label: 'BROWSE'),
                          BottomNavigationBarItem(icon: Icon(Icons.shopping_bag_outlined, size: 24), activeIcon: Icon(Icons.shopping_bag, size: 24), label: 'CART'),
                          BottomNavigationBarItem(icon: Icon(Icons.history_outlined, size: 24), activeIcon: Icon(Icons.history, size: 24), label: 'HISTORY'),
                          BottomNavigationBarItem(icon: Icon(Icons.account_balance_wallet_outlined, size: 24), activeIcon: Icon(Icons.account_balance_wallet, size: 24), label: 'WALLET'),
                          BottomNavigationBarItem(icon: Icon(Icons.settings_outlined, size: 24), activeIcon: Icon(Icons.settings, size: 24), label: 'SETTINGS'),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
