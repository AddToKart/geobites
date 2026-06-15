import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/menu_item.dart';
import '../../models/vendor.dart';
import '../../services/menu_service.dart';
import '../../services/vendor_service.dart';
import '../../providers/auth_provider.dart';
import '../../theme/glass_theme.dart';
import '../../widgets/glass_menu_dialog.dart';

class SellerMenuScreen extends StatefulWidget {
  const SellerMenuScreen({Key? key}) : super(key: key);

  @override
  _SellerMenuScreenState createState() => _SellerMenuScreenState();
}

class _SellerMenuScreenState extends State<SellerMenuScreen> {
  List<MenuItem> _menuItems = [];
  Vendor? _vendor;
  bool _isLoading = true;

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
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to delete item')));
    }
  }

  void _showAddItemDialog() {
    showDialog(
      context: context,
      builder: (context) {
        return GlassMenuDialog(
          onSave: (name, description, price) async {
            try {
              final auth = Provider.of<AuthProvider>(context, listen: false);
              final newItem = MenuItem(
                id: DateTime.now().millisecondsSinceEpoch.toString(),
                name: name,
                description: description,
                price: price,
                vendorId: auth.user!.id,
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: Text('Manage Menu', style: TextStyle(fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.onSurface)),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _vendor == null
              ? const Center(child: Text('Please setup your shop profile first in Settings.'))
              : ListView.builder(
                  padding: const EdgeInsets.only(top: 16.0, left: 16.0, right: 16.0, bottom: 100.0),
                  itemCount: _menuItems.length,
                  itemBuilder: (context, index) {
                    final item = _menuItems[index];
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 16.0),
                      child: NeumorphicCard(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          children: [
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
                              icon: const Icon(Icons.delete_outline, color: Colors.red),
                              onPressed: () => _deleteItem(item.id),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: Colors.transparent, // Let the gradient shine through
        elevation: 0,
        onPressed: _showAddItemDialog,
        child: Container(
          width: 60,
          height: 60,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: AppColors.primaryGradient,
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.4),
                blurRadius: 12,
                offset: const Offset(0, 4),
              )
            ],
          ),
          child: const Icon(Icons.add, color: Colors.white),
        ),
      ),
    );
  }
}
