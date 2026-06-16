import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/menu_item.dart';
import '../../models/vendor.dart';
import '../../services/menu_service.dart';
import '../../services/vendor_service.dart';
import '../../providers/auth_provider.dart';
import '../../theme/glass_theme.dart';
import '../../widgets/pagination_controls.dart';
import '../../widgets/glass_menu_dialog.dart';
import '../../widgets/glass_toast.dart';
import '../../core/api_client.dart';

class SellerMenuScreen extends StatefulWidget {
  const SellerMenuScreen({Key? key}) : super(key: key);

  @override
  _SellerMenuScreenState createState() => _SellerMenuScreenState();
}

class _SellerMenuScreenState extends State<SellerMenuScreen> {
  List<MenuItem> _menuItems = [];
  Vendor? _vendor;
  bool _isLoading = true;
  int _currentPage = 0;
  static const int _itemsPerPage = 5;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final vendors = await vendorService.getVendors(); // Usually backend returns logged in vendor
      final auth = Provider.of<AuthProvider>(context, listen: false);
      // Fallback way to find vendor linked to user
      final myVendor = vendors.firstWhere((v) => v.userId == auth.user?.id, orElse: () => throw Exception('Vendor profile not found'));
      _vendor = myVendor;

      final items = await menuService.getVendorMenu(myVendor.id);
      setState(() {
        _menuItems = items;
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading menu: $e');
      setState(() => _isLoading = false);
    }
  }

  Future<void> _deleteItem(String id) async {
    try {
      await menuService.deleteMenuItem(id);
      _loadData();
    } catch (e) {
      GlassToast.error(context, 'Failed to delete item');
    }
  }

  void _showAddItemDialog() {
    showDialog(
      context: context,
      builder: (context) {
        return GlassMenuDialog(
          onSave: (name, description, price, imageUrl) async {
            try {
              final newItem = MenuItem(
                id: DateTime.now().millisecondsSinceEpoch.toString(),
                name: name,
                description: description,
                price: price,
                imageUrl: imageUrl,
                vendorId: _vendor!.id,
                isAvailable: true,
                createdAt: DateTime.now().toIso8601String(),
                updatedAt: DateTime.now().toIso8601String(),
              );
              await menuService.addMenuItem(newItem);
              _loadData();
            } catch (e) {
              print('Error adding item: $e');
            }
          },
        );
      },
    );
  }

  void _showEditItemDialog(MenuItem item) {
    showDialog(
      context: context,
      builder: (context) {
        return GlassMenuDialog(
          initialItem: item,
          onSave: (name, description, price, imageUrl) async {
            try {
              final updates = {
                'name': name,
                'description': description,
                'price': price,
                'imageUrl': imageUrl,
              };
              await menuService.updateMenuItem(item.id, updates);
              _loadData();
            } catch (e) {
              print('Error updating item: $e');
            }
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: Text('Manage Menu', style: TextStyle(fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface)),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle, size: 28),
            color: AppColors.primary,
            onPressed: _showAddItemDialog,
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _vendor == null
              ? const Center(child: Text('Please setup your shop profile first in Settings.'))
              : Builder(
                  builder: (context) {
                    final int totalPages = (_menuItems.length / _itemsPerPage).ceil();
                    final paginatedItems = _menuItems.skip(_currentPage * _itemsPerPage).take(_itemsPerPage).toList();

                    return Column(
                      children: [
                        Expanded(
                          child: ListView.builder(
                            padding: const EdgeInsets.only(top: 16.0, left: 16.0, right: 16.0, bottom: 16.0),
                            itemCount: paginatedItems.length,
                            itemBuilder: (context, index) {
                              final item = paginatedItems[index];

                              return Padding(
                                padding: const EdgeInsets.only(bottom: 16.0),
                                child: NeumorphicCard(
                                  padding: const EdgeInsets.all(16),
                                  child: Row(
                                    children: [
                                      if (item.imageUrl != null && item.imageUrl!.isNotEmpty)
                                        Container(
                                          width: 60,
                                          height: 60,
                                          margin: const EdgeInsets.only(right: 16),
                                          child: ClipRRect(
                                            borderRadius: BorderRadius.circular(8),
                                            child: Image.network(
                                              item.imageUrl!.startsWith('http')
                                                  ? item.imageUrl!
                                                  : "${ApiClient.socketUrl}${item.imageUrl}",
                                              fit: BoxFit.cover,
                                              errorBuilder: (context, error, stackTrace) => Container(
                                                color: Colors.grey.withValues(alpha: 0.2),
                                                child: const Icon(Icons.broken_image, color: Colors.grey),
                                              ),
                                            ),
                                          ),
                                        ),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(item.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                            if (item.description != null) ...[
                                              const SizedBox(height: 4),
                                              Text(item.description!, style: const TextStyle(color: AppColors.primaryDark, fontSize: 12)),
                                            ],
                                            const SizedBox(height: 8),
                                            Text('₱${item.price.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary)),
                                          ],
                                        ),
                                      ),
                                      Switch(
                                        value: item.isAvailable,
                                        onChanged: (val) async {
                                          await menuService.updateMenuItem(item.id, {'isAvailable': val});
                                          _loadData();
                                        },
                                        activeColor: AppColors.primary,
                                      ),
                                      IconButton(
                                        icon: const Icon(Icons.edit_outlined, color: AppColors.primary),
                                        onPressed: () => _showEditItemDialog(item),
                                      ),
                                      IconButton(
                                        icon: const Icon(Icons.delete_outline, color: Colors.red),
                                        onPressed: () => _deleteItem(item.id),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                        PaginationControls(
                          currentPage: _currentPage,
                          totalPages: totalPages,
                          onPageChanged: (page) => setState(() => _currentPage = page),
                        ),
                      ],
                    );
                  },
                ),
    );
  }
}
