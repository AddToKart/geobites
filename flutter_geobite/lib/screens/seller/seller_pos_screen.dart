import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/menu_item.dart';
import '../../models/vendor.dart';
import '../../services/menu_service.dart';
import '../../services/vendor_service.dart';
import '../../services/order_service.dart';
import '../../providers/auth_provider.dart';
import '../../theme/glass_theme.dart';
import '../../widgets/glass_toast.dart';
import 'seller_receipt_screen.dart';

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

        final order = await orderService.placePosOrder(payload);
        
        // Clear cart on success
        setState(() {
          _cart.clear();
          _isLoading = false;
        });
        
        if (mounted) {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => SellerReceiptScreen(order: order),
            ),
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
          : LayoutBuilder(
              builder: (context, constraints) {
                final isDesktop = constraints.maxWidth > 800;
                
                return Column(
                  children: [
                    Expanded(
                      child: Row(
                        children: [
                          // Left side: Menu Items Grid
                          Expanded(
                            flex: 3,
                            child: _menuItems.isEmpty
                                ? const Center(child: Text('No available items.'))
                                : GridView.builder(
                                    padding: const EdgeInsets.all(16),
                                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                                      crossAxisCount: isDesktop ? 3 : 2,
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
                                                      : Container(color: Colors.grey.withValues(alpha: 0.2), child: const Icon(Icons.fastfood, size: 40)),
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
                                                        Text('₱${item.price.toStringAsFixed(2)}', style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
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
                          
                          // Right side: POS Cart (Visible only on desktop/tablet)
                          if (isDesktop)
                            Container(
                              width: 350,
                              decoration: BoxDecoration(
                                color: Theme.of(context).colorScheme.surface.withValues(alpha: 0.9),
                                border: Border(left: BorderSide(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.1))),
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
                                                contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                                                title: Text(item.name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold), maxLines: 2, overflow: TextOverflow.ellipsis),
                                                subtitle: Text('₱${(item.price * entry.value).toStringAsFixed(2)}', style: const TextStyle(color: AppColors.primary)),
                                                trailing: Row(
                                                  mainAxisSize: MainAxisSize.min,
                                                  children: [
                                                    IconButton(
                                                      icon: const Icon(Icons.remove_circle_outline, size: 24),
                                                      onPressed: () => _removeFromCart(item),
                                                      padding: EdgeInsets.zero,
                                                      constraints: const BoxConstraints(),
                                                    ),
                                                    const SizedBox(width: 8),
                                                    Text('${entry.value}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                                    const SizedBox(width: 8),
                                                    IconButton(
                                                      icon: const Icon(Icons.add_circle_outline, size: 24),
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
                                    padding: const EdgeInsets.all(24),
                                    decoration: BoxDecoration(
                                      color: Theme.of(context).colorScheme.surface,
                                      boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, -5))],
                                    ),
                                    child: Column(
                                      children: [
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            const Text('Total', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                                            Text('₱${_cartTotal.toStringAsFixed(2)}', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.primary)),
                                          ],
                                        ),
                                        const SizedBox(height: 24),
                                        SizedBox(
                                          width: double.infinity,
                                          height: 56,
                                          child: FilledButton(
                                            onPressed: _cart.isEmpty ? null : _processCheckout,
                                            style: FilledButton.styleFrom(
                                              backgroundColor: AppColors.primary,
                                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                            ),
                                            child: Text('Charge (${_cartItemCount} items)', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
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
                    ),
                    
                    // Mobile Bottom Bar
                    if (!isDesktop)
                      Container(
                        padding: EdgeInsets.only(left: 16, right: 16, top: 16, bottom: MediaQuery.of(context).padding.bottom + 16),
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.surface,
                          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 10, offset: const Offset(0, -5))],
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text('$_cartItemCount Items', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7), fontSize: 12)),
                                  Text('₱${_cartTotal.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: AppColors.primary)),
                                ],
                              ),
                            ),
                            OutlinedButton.icon(
                              onPressed: _showMobileCartDialog,
                              icon: const Icon(Icons.shopping_cart_outlined, size: 18),
                              label: const Text('View Cart'),
                            ),
                            const SizedBox(width: 8),
                            FilledButton.icon(
                              onPressed: _processCheckout,
                              style: FilledButton.styleFrom(backgroundColor: AppColors.primary),
                              icon: const Icon(Icons.payment, size: 18, color: Colors.white),
                              label: const Text('Charge', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                            ),
                          ],
                        ),
                      ),
                  ],
                );
              },
            ),
    );
  }

  void _showMobileCartDialog() {
    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return Dialog(
              backgroundColor: Theme.of(context).colorScheme.surface,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
              insetPadding: const EdgeInsets.all(16),
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Current Order', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                        IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
                      ],
                    ),
                    const Divider(),
                    if (_cart.isEmpty)
                      const Padding(
                        padding: EdgeInsets.all(32),
                        child: Center(child: Text('Cart is empty', style: TextStyle(fontSize: 16))),
                      )
                    else
                      Flexible(
                        child: ListView.builder(
                          shrinkWrap: true,
                          itemCount: _cart.length,
                          itemBuilder: (ctx, i) {
                            final entry = _cart.entries.elementAt(i);
                            final item = _menuItems.firstWhere((it) => it.id == entry.key);
                            return Padding(
                              padding: const EdgeInsets.symmetric(vertical: 8.0),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(item.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                                        Text('₱${(item.price * entry.value).toStringAsFixed(2)}', style: const TextStyle(color: AppColors.primary)),
                                      ],
                                    ),
                                  ),
                                  Container(
                                    decoration: BoxDecoration(
                                      color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.05),
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        IconButton(
                                          icon: const Icon(Icons.remove, size: 18),
                                          onPressed: () {
                                            _removeFromCart(item);
                                            setDialogState((){});
                                            if (_cart.isEmpty) Navigator.pop(context);
                                          },
                                        ),
                                        Text('${entry.value}', style: const TextStyle(fontWeight: FontWeight.bold)),
                                        IconButton(
                                          icon: const Icon(Icons.add, size: 18),
                                          onPressed: () {
                                            _addToCart(item);
                                            setDialogState((){});
                                          },
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                      ),
                    const SizedBox(height: 16),
                    const Divider(),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Total:', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        Text('₱${_cartTotal.toStringAsFixed(2)}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.primary)),
                      ],
                    ),
                    const SizedBox(height: 24),
                    FilledButton(
                      onPressed: _cart.isEmpty ? null : () {
                        Navigator.pop(context);
                        _processCheckout();
                      },
                      style: FilledButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        backgroundColor: AppColors.primary,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: const Text('PROCEED TO CHECKOUT', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, letterSpacing: 1.2)),
                    )
                  ],
                ),
              ),
            );
          }
        );
      }
    );
  }
}
