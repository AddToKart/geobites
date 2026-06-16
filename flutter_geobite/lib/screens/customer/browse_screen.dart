import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:dio/dio.dart';
import 'package:mapcn_flutter/mapcn_flutter.dart';
import 'package:latlong2/latlong.dart';
import '../../models/vendor.dart';
import '../../services/vendor_service.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../theme/glass_theme.dart';
import '../../widgets/vendor_card.dart';
import 'vendor_detail_screen.dart';
import 'customer_profile_screen.dart';
import 'cart_screen.dart';
import '../../widgets/pagination_controls.dart';
import 'notification_detail_screen.dart';
import '../../providers/notification_provider.dart';
import '../../widgets/glass_toast.dart';
import '../../widgets/locate_me_button.dart';

const int _kPageSize = 12;

class BrowseScreen extends StatefulWidget {
  @override
  _BrowseScreenState createState() => _BrowseScreenState();
}

class _BrowseScreenState extends State<BrowseScreen> {
  // ── Data ──────────────────────────────────────────────────────────────────
  final List<Vendor> _vendors = [];
  int _currentPage = 1;
  int _totalVendors = 0;
  bool _isLoading = false;

  // ── UI State ──────────────────────────────────────────────────────────────
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  String _selectedCategory = 'ALL';
  String _viewMode = 'LIST'; // 'GRID', 'LIST', 'MAP'

  MapcnController? _mapController;

  double? _currentTemperature;
  String _currentGreeting = 'DAY';

  // ── Scroll controller ─────────────────────────────────────────────────────
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _loadPage(1);
    _loadWeather();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  // ── Load helpers ──────────────────────────────────────────────────────────

  Future<void> _loadPage(int page) async {
    if (_isLoading) return;
    setState(() {
      _isLoading = true;
      _vendors.clear();
    });

    try {
      final result = await vendorService.getVendorsPaginated(
        page: page,
        limit: _kPageSize,
        search: _searchQuery.isNotEmpty ? _searchQuery : null,
      );
      setState(() {
        _vendors.addAll(result.data);
        _currentPage = result.page;
        _totalVendors = result.total;
      });
      if (_scrollController.hasClients) {
        _scrollController.jumpTo(0);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not load restaurants: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _refresh() => _loadPage(1);

  void _onSearchChanged(String value) {
    _searchQuery = value;
    // Debounce: reload after 400ms of inactivity
    Future.delayed(const Duration(milliseconds: 400), () {
      if (_searchQuery == value) {
        _loadPage(1);
      }
    });
  }

  Future<void> _loadWeather() async {
    try {
      final hour = DateTime.now().hour;
      setState(() {
        if (hour >= 5 && hour < 12) {
          _currentGreeting = 'MORNING';
        } else if (hour >= 12 && hour < 17) {
          _currentGreeting = 'AFTERNOON';
        } else if (hour >= 17 && hour < 20) {
          _currentGreeting = 'EVENING';
        } else {
          _currentGreeting = 'NIGHT';
        }
      });
      final response = await Dio().get(
        'https://api.open-meteo.com/v1/forecast'
        '?latitude=14.8214&longitude=120.9565&current_weather=true',
      );
      if (response.data?['current_weather'] != null) {
        setState(() {
          _currentTemperature =
              (response.data['current_weather']['temperature'] as num)
                  .toDouble();
        });
      }
    } catch (_) {}
  }

  // ── Category filter (client-side on top of server search) ────────────────

  List<Vendor> get _filteredVendors {
    if (_selectedCategory == 'ALL') return _vendors;
    final cat = _selectedCategory.toLowerCase();
    final keywords = <String, List<String>>{
      'silog': ['silog', 'breakfast', 'almusal', 'tapsi'],
      'ihaw-ihaw': ['ihaw', 'grill', 'bbq', 'inasal'],
      'snacks': ['snack', 'tusok', 'siomai', 'street', 'merienda'],
      'drinks': ['drinks', 'kape', 'coffee', 'juice', 'tea'],
    }[cat] ?? [cat];

    return _vendors.where((v) {
      final text = '${v.name} ${v.description ?? ''}'.toLowerCase();
      return keywords.any((kw) => text.contains(kw));
    }).toList();
  }

  // ── UI ────────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).user;
    final filtered = _filteredVendors;

    return GlassScaffold(
      appBar: GlassAppBar(
        title: GestureDetector(
          onTap: () => Navigator.push(context,
              MaterialPageRoute(builder: (_) => const CustomerProfileScreen())),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Deliver to',
                  style: TextStyle(
                      fontSize: 12,
                      color: Theme.of(context)
                          .colorScheme
                          .onSurface
                          .withValues(alpha: 0.6))),
              Row(
                children: [
                  Flexible(
                    child: Text(
                      user?.address ?? 'Current Location',
                      style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Theme.of(context).colorScheme.onSurface),
                      overflow: TextOverflow.ellipsis,
                      maxLines: 1,
                    ),
                  ),
                  const SizedBox(width: 4),
                  const Icon(Icons.keyboard_arrow_down,
                      size: 16, color: AppColors.primary),
                ],
              ),
            ],
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(
              Provider.of<ThemeProvider>(context).themeMode == ThemeMode.dark
                  ? Icons.light_mode
                  : Icons.dark_mode,
              color: Theme.of(context).colorScheme.onSurface,
            ),
            onPressed: () =>
                Provider.of<ThemeProvider>(context, listen: false)
                    .toggleTheme(),
          ),
          Consumer<NotificationProvider>(
            builder: (context, notificationProvider, _) {
              final unreadCount = notificationProvider.unreadCount;
              final notifications = notificationProvider.notifications;
              
              return Stack(
                clipBehavior: Clip.none,
                children: [
                  PopupMenuButton<String>(
                    icon: Icon(Icons.notifications_none, color: Theme.of(context).colorScheme.onSurface, size: 24),
                    padding: EdgeInsets.zero,
                    offset: const Offset(0, 40),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(kSharpRadius)),
                    color: Theme.of(context).colorScheme.surface,
                    onSelected: (value) {
                      if (value == 'read_all') {
                        notificationProvider.markAllAsRead();
                        GlassToast.success(context, 'All marked as read');
                      } else if (value == 'clear') {
                        notificationProvider.clearLocal();
                        GlassToast.info(context, 'Notifications cleared');
                      } else {
                        // Find the notification data
                        final notif = notificationProvider.notifications.firstWhere((n) => n['id'] == value, orElse: () => {});
                        notificationProvider.markAsRead(value);
                        if (notif != null) {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => NotificationDetailScreen(notification: notif),
                            ),
                          );
                        }
                      }
                    },
                    itemBuilder: (BuildContext context) {
                      final List<PopupMenuEntry<String>> items = [];
                      
                      if (notifications.isEmpty) {
                        items.add(
                          const PopupMenuItem<String>(
                            enabled: false,
                            child: Text('No notifications', style: TextStyle(color: Colors.grey)),
                          ),
                        );
                      } else {
                        for (var notification in notifications.take(5)) {
                          final isRead = notification['isRead'] as bool? ?? false;
                          items.add(
                            PopupMenuItem<String>(
                              value: notification['id'],
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      if (!isRead)
                                        Container(
                                          margin: const EdgeInsets.only(right: 6),
                                          width: 6,
                                          height: 6,
                                          decoration: const BoxDecoration(
                                            color: AppColors.primary,
                                            shape: BoxShape.circle,
                                          ),
                                        ),
                                      Expanded(
                                        child: Text(
                                          notification['title'] ?? 'Notification',
                                          style: TextStyle(
                                            fontWeight: isRead ? FontWeight.normal : FontWeight.bold,
                                            fontSize: 13,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    notification['message'] ?? '',
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                          items.add(const PopupMenuDivider());
                        }
                      }
                      
                      items.addAll([
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
                      ]);
                      
                      return items;
                    },
                  ),
                  if (unreadCount > 0)
                    Positioned(
                      top: 4,
                      right: 4,
                      child: Container(
                        padding: const EdgeInsets.all(2),
                        decoration: const BoxDecoration(
                          color: Colors.red,
                          shape: BoxShape.circle,
                        ),
                        constraints: const BoxConstraints(
                          minWidth: 14,
                          minHeight: 14,
                        ),
                        child: Text(
                          '$unreadCount',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 8,
                            fontWeight: FontWeight.bold,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                ],
              );
            },
          ),
          IconButton(
            icon: Icon(Icons.shopping_bag_outlined,
                color: Theme.of(context).colorScheme.onSurface),
            onPressed: () => Navigator.push(
                context, MaterialPageRoute(builder: (_) => CartScreen())),
          ),
          IconButton(
            icon: Icon(Icons.person_outline,
                color: Theme.of(context).colorScheme.onSurface),
            onPressed: () => Navigator.push(context,
                MaterialPageRoute(builder: (_) => const CustomerProfileScreen())),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: CustomScrollView(
          controller: _scrollController,
          slivers: [
            // ── Header ────────────────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 24, 16, 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Weather greeting
                    Row(
                      children: [
                        const Icon(Icons.wb_twilight,
                            color: AppColors.primary, size: 16),
                        const SizedBox(width: 8),
                        Text(
                          '$_currentGreeting IN SANTA MARIA  •  '
                          '${_currentTemperature != null ? "${_currentTemperature!.toStringAsFixed(1)}°C" : "--°C"}',
                          style: const TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.5,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'What are you\ncraving?',
                      style: Theme.of(context)
                          .textTheme
                          .displayMedium
                          ?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: Theme.of(context).colorScheme.onSurface,
                              height: 1.1),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _isLoading
                          ? 'Loading restaurants…'
                          : '$_totalVendors restaurants available',
                      style: TextStyle(
                        color: Theme.of(context)
                            .colorScheme
                            .onSurface
                            .withValues(alpha: 0.6),
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 24),
                    // Search
                    TextField(
                      controller: _searchController,
                      onChanged: _onSearchChanged,
                      decoration: InputDecoration(
                        hintText:
                            'Search restaurants, groceries, or dishes...',
                        filled: true,
                        fillColor: Theme.of(context)
                            .colorScheme
                            .surface
                            .withOpacity(0.5),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide.none,
                        ),
                        prefixIcon: Icon(Icons.search,
                            color: Theme.of(context)
                                .colorScheme
                                .onSurface
                                .withValues(alpha: 0.6)),
                        suffixIcon: _searchQuery.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear),
                                onPressed: () {
                                  _searchController.clear();
                                  _onSearchChanged('');
                                },
                              )
                            : null,
                      ),
                    ),
                    const SizedBox(height: 24),
                    // Categories
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: ['ALL', 'SILOG', 'IHAW-IHAW', 'SNACKS', 'DRINKS']
                            .map((cat) {
                          final isSelected = _selectedCategory == cat;
                          return Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: GestureDetector(
                              onTap: () =>
                                  setState(() => _selectedCategory = cat),
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 16, vertical: 10),
                                decoration: BoxDecoration(
                                  color: isSelected
                                      ? AppColors.primary
                                      : Colors.transparent,
                                  border: Border.all(
                                    color: isSelected
                                        ? AppColors.primary
                                        : Theme.of(context)
                                            .colorScheme
                                            .onSurface
                                            .withOpacity(0.1),
                                  ),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  cat,
                                  style: TextStyle(
                                    color: isSelected
                                        ? Colors.white
                                        : Theme.of(context)
                                            .colorScheme
                                            .onSurface,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                    const SizedBox(height: 32),
                    // View toggle + count
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Explore local kitchens',
                          style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: Theme.of(context).colorScheme.onSurface),
                        ),
                        Container(
                          decoration: BoxDecoration(
                            border: Border.all(
                              color: Theme.of(context)
                                  .colorScheme
                                  .onSurface
                                  .withOpacity(0.1),
                            ),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Row(
                            children: ['GRID', 'LIST', 'MAP'].map((mode) {
                              final isSelected = _viewMode == mode;
                              final isDark =
                                  Theme.of(context).brightness ==
                                      Brightness.dark;
                              return GestureDetector(
                                onTap: () =>
                                    setState(() => _viewMode = mode),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 12, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: isSelected
                                        ? (isDark
                                            ? Colors.white
                                            : Colors.black)
                                        : Colors.transparent,
                                  ),
                                  child: Text(
                                    mode,
                                    style: TextStyle(
                                      color: isSelected
                                          ? (isDark
                                              ? Colors.black
                                              : Colors.white)
                                          : Theme.of(context)
                                              .colorScheme
                                              .onSurface,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 10,
                                    ),
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            // ── Loading state (initial) ────────────────────────────────────
            if (_isLoading)
              const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator()),
              )

            // ── Empty state ────────────────────────────────────────────────
            else if (filtered.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.storefront_outlined,
                          size: 64, color: Colors.grey),
                      const SizedBox(height: 16),
                      const Text('No restaurants found.',
                          style: TextStyle(fontSize: 18)),
                      if (_searchQuery.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        TextButton(
                          onPressed: () {
                            _searchController.clear();
                            _onSearchChanged('');
                          },
                          child: const Text('Clear search'),
                        ),
                      ],
                    ],
                  ),
                ),
              )

            // ── MAP view ──────────────────────────────────────────────────
            else if (_viewMode == 'MAP')
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Container(
                    height: 400,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(kSharpRadius),
                      border: Border.all(
                          color: Theme.of(context)
                              .colorScheme
                              .onSurface
                              .withOpacity(0.1)),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(kSharpRadius),
                      child: Stack(
                        children: [
                          Mapcn(
                            controller: _mapController,
                            initialCenter:
                                const LatLng(14.8214, 120.9565),
                            initialZoom: 14,
                            style: Theme.of(context).brightness ==
                                    Brightness.dark
                                ? MapcnStyle.midnight
                                : MapcnStyle.normal,
                            accentColor: AppColors.primary,
                            markerConfig: const MarkerConfig(
                              style: MarkerStyle.pulse,
                              pulseRadius: 35,
                              glowIntensity: 0.8,
                              showShadow: true,
                              coreRadius: 8,
                            ),
                            points: filtered
                                .map((v) => LatLng(v.latitude, v.longitude))
                                .toList(),
                          ),
                          Positioned(
                            top: 12,
                            right: 12,
                            child: LocateMeButton(
                              mapController: _mapController,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              )

            // ── GRID view ─────────────────────────────────────────────────
            else if (_viewMode == 'GRID')
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverGrid(
                  gridDelegate:
                      const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.75,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                  ),
                  delegate: SliverChildBuilderDelegate(
                    (context, index) => VendorCard(
                      vendor: filtered[index],
                      onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                              builder: (_) =>
                                  VendorDetailScreen(vendor: filtered[index]))),
                    ),
                    childCount: filtered.length,
                  ),
                ),
              )

            // ── LIST view (default) ───────────────────────────────────────
            else
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) => Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: VendorCard(
                        vendor: filtered[index],
                        onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                                builder: (_) => VendorDetailScreen(
                                    vendor: filtered[index]))),
                      ),
                    ),
                    childCount: filtered.length,
                  ),
                ),
              ),

            // ── Pagination Controls ───────────────────────────────────────
            SliverToBoxAdapter(
              child: PaginationControls(
                currentPage: _currentPage - 1,
                totalPages: (_totalVendors / _kPageSize).ceil(),
                bottomPadding: 32,
                onPageChanged: (pageIndex) {
                  _loadPage(pageIndex + 1);
                },
              ),
            ),

            // Bottom padding for nav bar
            const SliverToBoxAdapter(child: SizedBox(height: 80)),
          ],
        ),
      ),
    );
  }
}
