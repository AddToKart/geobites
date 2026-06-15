import 'package:flutter/material.dart';
import '../../theme/glass_theme.dart';
import 'seller_dashboard_screen.dart';
import 'seller_kds_screen.dart';
import 'seller_menu_screen.dart';
import 'seller_orders_screen.dart';
import 'seller_more_screen.dart';

class SellerMainScreen extends StatefulWidget {
  const SellerMainScreen({Key? key}) : super(key: key);

  @override
  _SellerMainScreenState createState() => _SellerMainScreenState();
}

class _SellerMainScreenState extends State<SellerMainScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const SellerDashboardScreen(),
    const SellerKdsScreen(),
    const SellerMenuScreen(),
    const SellerOrdersScreen(),
    const SellerMoreScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return GlassScaffold(
      body: _screens[_currentIndex],
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          border: Border(top: BorderSide(color: Theme.of(context).brightness == Brightness.dark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.05))),
        ),
        child: SafeArea(
          child: BottomNavigationBar(
            currentIndex: _currentIndex,
            onTap: (index) => setState(() => _currentIndex = index),
            type: BottomNavigationBarType.fixed,
            backgroundColor: Colors.transparent,
            elevation: 0,
            selectedItemColor: AppColors.primary,
            unselectedItemColor: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
            items: const [
              BottomNavigationBarItem(icon: Icon(Icons.dashboard_outlined, size: 24), activeIcon: Icon(Icons.dashboard, size: 24), label: 'Overview'),
              BottomNavigationBarItem(icon: Icon(Icons.kitchen_outlined, size: 24), activeIcon: Icon(Icons.kitchen, size: 24), label: 'KDS'),
              BottomNavigationBarItem(icon: Icon(Icons.restaurant_menu_outlined, size: 24), activeIcon: Icon(Icons.restaurant_menu, size: 24), label: 'Catalog'),
              BottomNavigationBarItem(icon: Icon(Icons.receipt_long_outlined, size: 24), activeIcon: Icon(Icons.receipt_long, size: 24), label: 'Orders'),
              BottomNavigationBarItem(icon: Icon(Icons.more_horiz, size: 24), activeIcon: Icon(Icons.more_horiz, size: 24), label: 'More'),
            ],
          ),
        ),
      ),
    );
  }
}
