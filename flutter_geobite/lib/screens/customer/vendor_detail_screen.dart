import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/vendor.dart';
import '../../models/menu_item.dart';
import '../../services/menu_service.dart';
import '../../providers/cart_provider.dart';
import '../../theme/glass_theme.dart';
import '../../widgets/menu_item_card.dart';
import '../../widgets/animated_tap_card.dart';
import '../../widgets/pagination_controls.dart';
import 'cart_screen.dart';
import 'vendor_reviews_screen.dart';
import '../../core/api_client.dart';

class VendorDetailScreen extends StatefulWidget {
  final Vendor vendor;

  const VendorDetailScreen({Key? key, required this.vendor}) : super(key: key);

  @override
  _VendorDetailScreenState createState() => _VendorDetailScreenState();
}

class _VendorDetailScreenState extends State<VendorDetailScreen> {
  List<MenuItem> _menuItems = [];
  bool _isLoading = true;
  int _currentPage = 0;
  static const int _itemsPerPage = 5;

  @override
  void initState() {
    super.initState();
    _loadMenu();
  }

  Future<void> _loadMenu() async {
    try {
      final items = await menuService.getVendorMenu(widget.vendor.id);
      setState(() {
        _menuItems = items;
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading menu: $e');
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = Provider.of<CartProvider>(context);
    final int totalPages = (_menuItems.length / _itemsPerPage).ceil();
    final paginatedItems = _menuItems.skip(_currentPage * _itemsPerPage).take(_itemsPerPage).toList();

    return GlassScaffold(
      appBar: const GlassAppBar(),
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Hero(
              tag: 'vendor_image_${widget.vendor.id}',
              child: Container(
                height: 250,
                width: double.infinity,
                decoration: BoxDecoration(
                  image: DecorationImage(
                    image: NetworkImage(
                      (widget.vendor.imageUrl != null && widget.vendor.imageUrl!.isNotEmpty)
                          ? (widget.vendor.imageUrl!.startsWith('http')
                              ? widget.vendor.imageUrl!
                              : "${ApiClient.socketUrl}${widget.vendor.imageUrl}")
                          : 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=600&auto=format&fit=crop',
                    ),
                    fit: BoxFit.cover,
                  ),
                ),
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Colors.black.withValues(alpha: 0.4), Colors.transparent, Theme.of(context).colorScheme.surface],
                      stops: const [0.0, 0.5, 1.0],
                    ),
                  ),
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: NeumorphicCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.vendor.name,
                      style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: Theme.of(context).colorScheme.onSurface,
                          ),
                    ),
                    const SizedBox(height: 8),
                    InkWell(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => VendorReviewsScreen(vendor: widget.vendor)),
                        );
                      },
                      borderRadius: BorderRadius.circular(8),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4.0),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.star, size: 16, color: Colors.orange),
                            const SizedBox(width: 4),
                            Text(
                              '${widget.vendor.rating.toStringAsFixed(1)} (${widget.vendor.totalRatings} reviews)',
                              style: TextStyle(fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.8), decoration: TextDecoration.underline),
                            ),
                            const SizedBox(width: 4),
                            Icon(Icons.chevron_right, size: 16, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6)),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(Icons.location_on_outlined, size: 16, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6)),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            widget.vendor.address,
                            style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
          if (_isLoading)
            const SliverFillRemaining(
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_menuItems.isEmpty)
            const SliverFillRemaining(
              child: Center(child: Text('No menu items available.')),
            )
          else ...[
            SliverPadding(
              padding: const EdgeInsets.only(top: 16.0, left: 16.0, right: 16.0),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final item = paginatedItems[index];
                    final cartItem = cart.items.firstWhere(
                      (ci) => ci.menuItem.id == item.id,
                      orElse: () => CartItem(menuItem: item, quantity: 0),
                    );
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 16.0),
                      child: MenuItemCard(
                        item: item,
                        quantity: cartItem.quantity,
                        onAdd: () => cart.addItem(item, widget.vendor.id),
                        onRemove: () => cart.updateQuantity(item.id, cartItem.quantity - 1),
                      ),
                    );
                  },
                  childCount: paginatedItems.length,
                ),
              ),
            ),
            if (totalPages > 1)
              SliverToBoxAdapter(
                child: PaginationControls(
                  currentPage: _currentPage,
                  totalPages: totalPages,
                  bottomPadding: 32,
                  onPageChanged: (page) => setState(() => _currentPage = page),
                ),
              ),
          ],
          const SliverToBoxAdapter(child: SizedBox(height: 100)),
        ],
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      floatingActionButton: cart.items.isNotEmpty
          ? Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: AnimatedTapCard(
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(kSharpRadius),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withOpacity(0.6),
                        blurRadius: 24,
                        spreadRadius: 4,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: FilledButton(
                    onPressed: () {
                      Navigator.push(context, MaterialPageRoute(builder: (_) => CartScreen()));
                    },
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(kSharpRadius)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(kSharpRadius),
                        ),
                        child: Text('${cart.items.fold(0, (sum, i) => sum + i.quantity)}', style: const TextStyle(fontWeight: FontWeight.bold)),
                      ),
                      const Text('View Cart', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      Text('₱${cart.total.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    ],
                  ),
                ),
              ),
            ),
          )
          : null,
    );
  }
}
