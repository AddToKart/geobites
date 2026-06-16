import 'package:flutter/material.dart';
import '../../theme/glass_theme.dart';
import 'seller_dashboard_screen.dart';
import 'seller_kds_screen.dart';
import 'seller_menu_screen.dart';
import 'seller_orders_screen.dart';
import 'seller_more_screen.dart';
import 'seller_shop_screen.dart';
import '../../providers/auth_provider.dart';
import '../../services/vendor_service.dart';
import 'package:provider/provider.dart';
import '../../services/socket_service.dart';

class SellerMainScreen extends StatefulWidget {
  const SellerMainScreen({Key? key}) : super(key: key);

  @override
  _SellerMainScreenState createState() => _SellerMainScreenState();
}

class _SellerMainScreenState extends State<SellerMainScreen> {
  int _currentIndex = 0;
  bool _isLoading = true;
  bool _needsSetup = false;

  final List<Widget> _screens = [
    const SellerDashboardScreen(),
    const SellerKdsScreen(),
    const SellerMenuScreen(),
    const SellerOrdersScreen(),
    const SellerMoreScreen(),
  ];

  @override
  void initState() {
    super.initState();
    _checkVendorProfile();
  }

  Future<void> _checkVendorProfile() async {
    try {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final vendors = await vendorService.getVendors();
      final hasVendor = vendors.any((v) => v.userId == auth.user?.id);
      if (mounted) {
        setState(() {
          _needsSetup = !hasVendor;
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
    if (_isLoading) return const GlassScaffold(body: Center(child: CircularProgressIndicator()));
    if (_needsSetup) return const SellerShopScreen();

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
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                  colors: [
                    Theme.of(context).colorScheme.surface,
                    Theme.of(context).colorScheme.surface.withValues(alpha: 0.8),
                    Theme.of(context).colorScheme.surface.withValues(alpha: 0.0),
                  ],
                  stops: const [0.0, 0.6, 1.0],
                ),
              ),
              child: SafeArea(
                bottom: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 32, 16, 24),
                  child: Container(
                    decoration: BoxDecoration(
                      color: Theme.of(context).brightness == Brightness.dark 
                          ? const Color(0xFF1A1A1A).withValues(alpha: 0.6)
                          : Colors.white.withValues(alpha: 0.6),
                      borderRadius: BorderRadius.circular(30),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.1),
                          blurRadius: 20,
                          spreadRadius: 5,
                          offset: const Offset(0, 5),
                        ),
                      ],
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.2),
                        width: 1,
                      ),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(30),
                      child: Theme(
                        data: Theme.of(context).copyWith(
                          splashColor: Colors.transparent,
                          highlightColor: Colors.transparent,
                        ),
                        child: BottomNavigationBar(
                          currentIndex: _currentIndex,
                          onTap: (index) => setState(() => _currentIndex = index),
                          type: BottomNavigationBarType.fixed,
                          backgroundColor: Colors.transparent,
                          elevation: 0,
                          selectedItemColor: AppColors.primary,
                          unselectedItemColor: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                          showSelectedLabels: true,
                          showUnselectedLabels: true,
                          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 10),
                          unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.normal, fontSize: 10),
                          items: [
                            _buildNavItem(Icons.dashboard_outlined, Icons.dashboard, 'Overview', 0),
                            _buildNavItem(Icons.kitchen_outlined, Icons.kitchen, 'KDS', 1),
                            _buildNavItem(Icons.restaurant_menu_outlined, Icons.restaurant_menu, 'Catalog', 2),
                            _buildNavItem(Icons.receipt_long_outlined, Icons.receipt_long, 'Orders', 3),
                            _buildNavItem(Icons.more_horiz, Icons.more_horiz, 'More', 4),
                          ],
                        ),
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

  BottomNavigationBarItem _buildNavItem(IconData icon, IconData activeIcon, String label, int index) {
    final isSelected = _currentIndex == index;
    return BottomNavigationBarItem(
      icon: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary.withValues(alpha: 0.15) : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Icon(isSelected ? activeIcon : icon, size: 24),
      ),
      activeIcon: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: AppColors.primary.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Icon(activeIcon, size: 24),
      ),
      label: label,
    );
  }
}
