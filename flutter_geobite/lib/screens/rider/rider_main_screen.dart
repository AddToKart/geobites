import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../theme/glass_theme.dart';
import '../../providers/notification_provider.dart';
import '../../widgets/glass_toast.dart';
import 'rider_dashboard_screen.dart';
import 'rider_profile_screen.dart';
import '../customer/wallet_screen.dart';
import '../../providers/auth_provider.dart';

class RiderMainScreen extends StatefulWidget {
  const RiderMainScreen({Key? key}) : super(key: key);

  @override
  _RiderMainScreenState createState() => _RiderMainScreenState();
}

class _RiderMainScreenState extends State<RiderMainScreen> {
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
    const RiderDashboardScreen(),
    const WalletScreen(),
    const RiderProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return GlassScaffold(
      extendBody: true,
      body: Stack(
        children: [
          _screens[_currentIndex],
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
                      color: Theme.of(context).colorScheme.surface.withOpacity(0.95),
                      borderRadius: BorderRadius.circular(kSharpRadius),
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
                      borderRadius: BorderRadius.circular(kSharpRadius),
                      child: BottomNavigationBar(
                        currentIndex: _currentIndex,
                        onTap: (index) => setState(() => _currentIndex = index),
                        backgroundColor: Colors.transparent,
                        elevation: 0,
                        selectedItemColor: AppColors.primary,
                        unselectedItemColor: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
                        showSelectedLabels: true,
                        showUnselectedLabels: true,
                        type: BottomNavigationBarType.fixed,
                        items: const [
                          BottomNavigationBarItem(icon: Icon(Icons.two_wheeler_outlined), activeIcon: Icon(Icons.two_wheeler), label: 'Deliveries'),
                          BottomNavigationBarItem(icon: Icon(Icons.account_balance_wallet_outlined), activeIcon: Icon(Icons.account_balance_wallet), label: 'GeoPay'),
                          BottomNavigationBarItem(icon: Icon(Icons.person_outline), activeIcon: Icon(Icons.person), label: 'Profile'),
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
