import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:http/http.dart' as http;
import '../../models/order.dart';
import '../../services/order_service.dart';
import '../../providers/auth_provider.dart';
import '../../theme/glass_theme.dart';
import '../../providers/theme_provider.dart';
import '../../widgets/animated_tap_card.dart';
import '../../widgets/pagination_controls.dart';
import 'rider_accept_task_screen.dart';
import 'rider_delivery_screen.dart';
import '../../widgets/glass_toast.dart';
import '../../services/socket_service.dart';
import 'dart:async';

class RiderDashboardScreen extends StatefulWidget {
  const RiderDashboardScreen({Key? key}) : super(key: key);

  @override
  _RiderDashboardScreenState createState() => _RiderDashboardScreenState();
}

class _RiderDashboardScreenState extends State<RiderDashboardScreen> {
  List<Order> _availableOrders = [];
  List<Order> _myDeliveries = [];
  bool _isLoading = true;
  String _temperature = '32°C';
  IconData _weatherIcon = Icons.wb_sunny;
  
  int _currentPage = 0;
  static const int _itemsPerPage = 5;
  StreamSubscription? _orderSub;
  StreamSubscription? _newOrderSub;

  @override
  void initState() {
    super.initState();
    _loadOrders();
    _fetchWeather();

    _orderSub = SocketService().orderStatusStream.listen((data) {
      _loadOrders();
    });

    _newOrderSub = SocketService().newOrderStream.listen((data) {
      if (mounted) {
        GlassToast.info(context, 'New delivery task available!');
        _loadOrders();
      }
    });
  }

  @override
  void dispose() {
    _orderSub?.cancel();
    _newOrderSub?.cancel();
    super.dispose();
  }

  Future<void> _fetchWeather() async {
    try {
      // Santa Maria coordinates: 14.8214, 120.9565
      final url = Uri.parse('https://api.open-meteo.com/v1/forecast?latitude=14.8214&longitude=120.9565&current_weather=true');
      final response = await http.get(url);
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final temp = data['current_weather']['temperature'].round();
        final code = data['current_weather']['weathercode'];
        
        IconData icon = Icons.wb_sunny;
        if (code >= 1 && code <= 3) icon = Icons.cloud_queue;
        if (code >= 51 && code <= 65) icon = Icons.water_drop_outlined; // Rain
        if (code >= 71 && code <= 82) icon = Icons.ac_unit; // Snow/Hail
        if (code >= 95) icon = Icons.thunderstorm_outlined; // Thunderstorm

        if (mounted) {
          setState(() {
            _temperature = '$temp°C';
            _weatherIcon = icon;
          });
        }
      }
    } catch (e) {
      print('Failed to load weather: $e');
    }
  }

  Future<void> _loadOrders() async {
    setState(() => _isLoading = true);
    try {
      final orders = await orderService.getOrders();
      final currentUserId = Provider.of<AuthProvider>(context, listen: false).user?.id;
      
      final available = orders.where((o) => o.status == 'ready_for_pickup' && o.riderId == null).toList();
      final mine = orders.where((o) => o.riderId == currentUserId && (o.status == 'ready_for_pickup' || o.status == 'picked_up' || o.status == 'delivering')).toList();

      setState(() {
        _availableOrders = available;
        _myDeliveries = mine;
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading rider orders: $e');
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).user;
    
    final int totalPages = (_availableOrders.length / _itemsPerPage).ceil();
    final paginatedAvailableOrders = _availableOrders.skip(_currentPage * _itemsPerPage).take(_itemsPerPage).toList();

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _loadOrders,
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : ListView(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                  children: [
                    // --- Rich Header Section ---
                    const SizedBox(height: 8),
                    
                    // Location & Weather Bar
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.surface,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Theme.of(context).brightness == Brightness.dark ? Colors.white.withValues(alpha: 0.1) : Colors.black.withValues(alpha: 0.05)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Row(
                              children: [
                                const Icon(Icons.location_on, color: AppColors.primary, size: 20),
                                const SizedBox(width: 8),
                                const Expanded(
                                  child: Text(
                                    'Santa Maria, Bulacan',
                                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          Row(
                            children: [
                              Text(_temperature, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                              const SizedBox(width: 8),
                              Icon(_weatherIcon, color: Colors.orange, size: 20),
                              const SizedBox(width: 12),
                              Container(width: 1, height: 16, color: Colors.grey.withValues(alpha: 0.3)),
                              const SizedBox(width: 4),
                              Consumer<ThemeProvider>(
                                builder: (context, themeProvider, _) {
                                  return IconButton(
                                    icon: Icon(Theme.of(context).brightness == Brightness.dark ? Icons.dark_mode : Icons.light_mode, size: 20),
                                    padding: EdgeInsets.zero,
                                    constraints: const BoxConstraints(),
                                    onPressed: () {
                                      themeProvider.toggleTheme();
                                    },
                                  );
                                },
                              ),
                              const SizedBox(width: 12),
                              Stack(
                                clipBehavior: Clip.none,
                                children: [
                                  PopupMenuButton<String>(
                                    icon: const Icon(Icons.notifications_none, size: 20),
                                    padding: EdgeInsets.zero,
                                    offset: const Offset(0, 40),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                    color: Theme.of(context).colorScheme.surface,
                                    onSelected: (value) {
                                      if (value == 'read_all') {
                                        GlassToast.info(context, 'All marked as read');
                                      } else if (value == 'clear') {
                                        GlassToast.info(context, 'Notifications removed');
                                      }
                                    },
                                    itemBuilder: (BuildContext context) => <PopupMenuEntry<String>>[
                                      const PopupMenuItem<String>(
                                        value: 'view_1',
                                        child: Text('System: New deliveries available in Santa Maria!'),
                                      ),
                                      const PopupMenuDivider(),
                                      const PopupMenuItem<String>(
                                        value: 'read_all',
                                        child: Row(
                                          children: [
                                            Icon(Icons.checklist, size: 18),
                                            SizedBox(width: 8),
                                            Text('Mark all as read'),
                                          ],
                                        ),
                                      ),
                                      const PopupMenuItem<String>(
                                        value: 'clear',
                                        child: Row(
                                          children: [
                                            Icon(Icons.delete_outline, size: 18, color: Colors.red),
                                            SizedBox(width: 8),
                                            Text('Remove all notifications', style: TextStyle(color: Colors.red)),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                  Positioned(
                                    top: 0,
                                    right: 0,
                                    child: Container(
                                      width: 8,
                                      height: 8,
                                      decoration: const BoxDecoration(
                                        color: Colors.red,
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Hello, ${user?.name?.split(' ')[0] ?? 'Rider'}!',
                              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: AppColors.primary,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Ready to hit the road?',
                              style: TextStyle(fontSize: 16, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6)),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.1),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.two_wheeler, color: AppColors.primary, size: 32),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    
                    // Quick Stats Cards
                    Row(
                      children: [
                        Expanded(child: _buildQuickStat('Earnings', '₱1,250', Icons.account_balance_wallet, Colors.green)),
                        const SizedBox(width: 16),
                        Expanded(child: _buildQuickStat('Deliveries', '14', Icons.local_shipping, Colors.blue)),
                      ],
                    ),
                    const SizedBox(height: 32),
                    // --- End Header ---

                    if (_availableOrders.isNotEmpty) ...[
                      const Text('Incoming Tasks', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
                      const SizedBox(height: 16),
                      ...paginatedAvailableOrders.map((order) => _buildIncomingTaskCard(order)),
                      if (totalPages > 1)
                        PaginationControls(
                          currentPage: _currentPage,
                          totalPages: totalPages,
                          bottomPadding: 16.0,
                          onPageChanged: (page) => setState(() => _currentPage = page),
                        ),
                      const SizedBox(height: 24),
                    ],
                    const Text('My Deliveries', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
                    const SizedBox(height: 16),
                    if (_myDeliveries.isEmpty)
                      Container(
                        padding: const EdgeInsets.all(32),
                        alignment: Alignment.center,
                        child: Text('You have no active deliveries.', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5))),
                      )
                    else
                      ..._myDeliveries.map((order) => _buildMyDeliveryCard(order)),
                    const SizedBox(height: 80),
                  ],
                ),
        ),
      ),
    );
  }

  Widget _buildIncomingTaskCard(Order order) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: NeumorphicCard(
        child: ListTile(
          contentPadding: EdgeInsets.zero,
          leading: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
            child: const Icon(Icons.notifications_active, color: AppColors.primary),
          ),
          title: const Text('New Delivery Available', style: TextStyle(fontWeight: FontWeight.bold)),
          subtitle: Text('From: ${order.vendor?.name ?? 'Store'}\nTo: ${order.deliveryAddress}'),
          trailing: FilledButton(
            onPressed: () async {
              final accepted = await Navigator.push(context, MaterialPageRoute(builder: (_) => RiderAcceptTaskScreen(order: order)));
              if (accepted == true) _loadOrders();
            },
            child: const Text('View'),
          ),
        ),
      ),
    );
  }

  Widget _buildMyDeliveryCard(Order order) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: NeumorphicCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Order #${order.id.substring(0, 8).toUpperCase()}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(8)),
                  child: Text(order.status.toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.primary)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text('Pick up: ${order.vendor?.name ?? 'Store'}', style: TextStyle(fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface)),
            Text('Drop off: ${order.deliveryAddress}', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6))),
            if (order.notes != null && order.notes!.isNotEmpty)
              Text('Notes: ${order.notes}', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6), fontStyle: FontStyle.italic)),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: () {
                  Navigator.push(context, MaterialPageRoute(
                    builder: (_) => RiderDeliveryScreen(order: order),
                  )).then((_) => _loadOrders());
                },
                child: const Text('View Delivery Map'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickStat(String title, String value, IconData icon, Color color) {
    return NeumorphicCard(
      glowColor: color,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(height: 12),
          Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(title, style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6))),
        ],
      ),
    );
  }
}
