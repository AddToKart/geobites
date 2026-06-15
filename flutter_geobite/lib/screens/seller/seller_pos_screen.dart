import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/menu_item.dart';
import '../../models/vendor.dart';
import '../../services/menu_service.dart';
import '../../services/vendor_service.dart';
import '../../services/order_service.dart';
import '../../providers/auth_provider.dart';
import '../../theme/glass_theme.dart';

class SellerPosScreen extends StatefulWidget {
  const SellerPosScreen({Key? key}) : super(key: key);

  @override
  _SellerPosScreenState createState() => _SellerPosScreenState();
}

class _SellerPosScreenState extends State<SellerPosScreen> {
  List<MenuItem> _menuItems = [];
  Vendor? _vendor;
  bool _isLoading = true;
  
  // Cart state: mapping of menuItemId to quantity
  final Map<String, int> _cart = {};

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final vendors = await vendorService.getVendors();
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final myVendor = vendors.firstWhere((v) => v.userId == auth.user?.id, orElse: () => throw Exception('Vendor profile not found'));
      _vendor = myVendor;

      final items = await menuService.getVendorMenu(myVendor.id);
      setState(() {
        _menuItems = items.where((item) => item.isAvailable).toList();
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading POS menu: $e');
      setState(() => _isLoading = false);
    }
  }

  void _addToCart(MenuItem item) {
    setState(() {
      _cart[item.id] = (_cart[item.id] ?? 0) + 1;
    });
  }

  void _removeFromCart(MenuItem item) {
    setState(() {
      final current = _cart[item.id] ?? 0;
      if (current > 1) {
        _cart[item.id] = current - 1;
      } else {
        _cart.remove(item.id);
      }
    });
  }

  double get _cartTotal {
    double total = 0;
    for (var entry in _cart.entries) {
      final item = _menuItems.firstWhere((i) => i.id == entry.key);
      total += item.price * entry.value;
    }
    return total;
  }
  
  int get _cartItemCount {
    int count = 0;
    for (var value in _cart.values) {
      count += value;
    }
    return count;
  }

  Future<void> _processCheckout() async {
    if (_cart.isEmpty || _vendor == null) return;
    
    // Default to CASH
    String paymentMethod = 'CASH';
    
    // Quick checkout dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Theme.of(context).colorScheme.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Process Walk-in Order'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Total Amount: ₱${_cartTotal.toStringAsFixed(2)}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            const Text('Payment Method:'),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.primary),
                borderRadius: BorderRadius.circular(12),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: paymentMethod,
                  isExpanded: true,
                  onChanged: (val) {
                    // Update state if we make this stateful, but we keep it simple for now
                  },
                  items: ['CASH', 'GCASH', 'MAYA', 'QRPH']
                      .map((method) => DropdownMenuItem(value: method, child: Text(method)))
                      .toList(),
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppColors.primary),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Confirm & Pay'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      setState(() => _isLoading = true);
      try {
        final payload = {
          'vendorId': _vendor!.id,
          'paymentMethod': paymentMethod,
          'notes': 'POS Walk-in Order',
          'items': _cart.entries.map((e) => {
            'menuItemId': e.key,
            'quantity': e.value,
          }).toList(),
        };

        await orderService.placePosOrder(payload);
        
        // Clear cart on success
        setState(() {
          _cart.clear();
          _isLoading = false;
        });
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Order processed successfully!'), backgroundColor: Colors.green),
          );
        }
      } catch (e) {
        setState(() => _isLoading = false);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Checkout failed: $e'), backgroundColor: Colors.red),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return GlassScaffold(
      appBar: const GlassAppBar(
        title: Text('Point of Sale', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Row(
              children: [
                // Left side: Menu Items Grid
                Expanded(
                  flex: 3,
                  child: _menuItems.isEmpty
                      ? const Center(child: Text('No available items.'))
                      : GridView.builder(
                          padding: const EdgeInsets.all(16),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            childAspectRatio: 0.8,
                            crossAxisSpacing: 16,
                            mainAxisSpacing: 16,
                          ),
                          itemCount: _menuItems.length,
                          itemBuilder: (context, index) {
                            final item = _menuItems[index];
                            final quantity = _cart[item.id] ?? 0;
                            return GestureDetector(
                              onTap: () => _addToCart(item),
                              child: NeumorphicCard(
                                padding: EdgeInsets.zero,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.stretch,
                                  children: [
                                    Expanded(
                                      child: ClipRRect(
                                        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                                        child: (item.imageUrl != null && item.imageUrl!.isNotEmpty)
                                            ? Image.network(item.imageUrl!, fit: BoxFit.cover)
                                            : Container(color: Colors.grey.withOpacity(0.2), child: const Icon(Icons.fastfood, size: 40)),
                                      ),
                                    ),
                                    Padding(
                                      padding: const EdgeInsets.all(12.0),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(item.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16), maxLines: 1, overflow: TextOverflow.ellipsis),
                                          const SizedBox(height: 4),
                                          Row(
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            children: [
                                              Text('₱${item.price.toStringAsFixed(2)}', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
                                              if (quantity > 0)
                                                Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                                  decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(10)),
                                                  child: Text('x$quantity', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                                                ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                ),
                
                // Right side: POS Cart (Visible on tablets, or as a persistent panel on mobile)
                Container(
                  width: MediaQuery.of(context).size.width > 600 ? 300 : 120, // Responsive width
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.surface.withOpacity(0.9),
                    border: Border(left: BorderSide(color: Theme.of(context).colorScheme.onSurface.withOpacity(0.1))),
                  ),
                  child: Column(
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Text('Current Order', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                      ),
                      const Divider(height: 1),
                      Expanded(
                        child: _cart.isEmpty
                            ? const Center(child: Text('Cart is empty'))
                            : ListView.builder(
                                itemCount: _cart.length,
                                itemBuilder: (context, index) {
                                  final entry = _cart.entries.elementAt(index);
                                  final item = _menuItems.firstWhere((i) => i.id == entry.key);
                                  return ListTile(
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 8),
                                    title: Text(item.name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold), maxLines: 2, overflow: TextOverflow.ellipsis),
                                    subtitle: Text('₱${(item.price * entry.value).toStringAsFixed(2)}', style: TextStyle(color: AppColors.primary)),
                                    trailing: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        IconButton(
                                          icon: const Icon(Icons.remove_circle_outline, size: 20),
                                          onPressed: () => _removeFromCart(item),
                                          padding: EdgeInsets.zero,
                                          constraints: const BoxConstraints(),
                                        ),
                                        const SizedBox(width: 4),
                                        Text('${entry.value}', style: const TextStyle(fontWeight: FontWeight.bold)),
                                        const SizedBox(width: 4),
                                        IconButton(
                                          icon: const Icon(Icons.add_circle_outline, size: 20),
                                          onPressed: () => _addToCart(item),
                                          padding: EdgeInsets.zero,
                                          constraints: const BoxConstraints(),
                                        ),
                                      ],
                                    ),
                                  );
                                },
                              ),
                      ),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.surface,
                          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -5))],
                        ),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Total', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                                Text('₱${_cartTotal.toStringAsFixed(2)}', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primary)),
                              ],
                            ),
                            const SizedBox(height: 16),
                            SizedBox(
                              width: double.infinity,
                              height: 50,
                              child: FilledButton(
                                onPressed: _cart.isEmpty ? null : _processCheckout,
                                style: FilledButton.styleFrom(
                                  backgroundColor: AppColors.primary,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                ),
                                child: Text('Charge (${_cartItemCount})', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}
