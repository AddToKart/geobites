import 'package:flutter/material.dart';
import '../models/menu_item.dart';

class CartItem {
  final MenuItem menuItem;
  int quantity;

  CartItem({required this.menuItem, this.quantity = 1});
}

class CartProvider with ChangeNotifier {
  String? _vendorId;
  final List<CartItem> _items = [];

  String? get vendorId => _vendorId;
  List<CartItem> get items => _items;

  double get total {
    return _items.fold(0, (sum, item) => sum + (item.menuItem.price * item.quantity));
  }

  void addItem(MenuItem menuItem, String vendorId) {
    if (_vendorId != null && _vendorId != vendorId) {
      // Different vendor, clear cart first
      _items.clear();
    }
    _vendorId = vendorId;

    final index = _items.indexWhere((item) => item.menuItem.id == menuItem.id);
    if (index >= 0) {
      _items[index].quantity++;
    } else {
      _items.add(CartItem(menuItem: menuItem, quantity: 1));
    }
    notifyListeners();
  }

  void updateQuantity(String menuItemId, int quantity) {
    final index = _items.indexWhere((item) => item.menuItem.id == menuItemId);
    if (index >= 0) {
      if (quantity <= 0) {
        _items.removeAt(index);
      } else {
        _items[index].quantity = quantity;
      }
      if (_items.isEmpty) {
        _vendorId = null;
      }
      notifyListeners();
    }
  }

  void clearCart() {
    _items.clear();
    _vendorId = null;
    notifyListeners();
  }
}
