import 'user.dart';
import 'vendor.dart';
import 'rating.dart';
import 'rider_rating.dart';
import 'dart:convert';

class OrderItem {
  final String id;
  final String orderId;
  final String menuItemId;
  final String name;
  final int quantity;
  final double price;

  OrderItem({
    required this.id,
    required this.orderId,
    required this.menuItemId,
    required this.name,
    required this.quantity,
    required this.price,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      id: json['id'],
      orderId: json['orderId'],
      menuItemId: json['menuItemId'],
      name: json['name'],
      quantity: json['quantity'],
      price: (json['price'] as num).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'orderId': orderId,
      'menuItemId': menuItemId,
      'name': name,
      'quantity': quantity,
      'price': price,
    };
  }
}

class Order {
  final String id;
  final String customerId;
  final String vendorId;
  final String? riderId;
  final String status;
  final double totalAmount;
  final String deliveryAddress;
  final double? deliveryLat;
  final double? deliveryLng;
  final double? riderLat;
  final double? riderLng;
  final String? notes;
  final String? paymentMethod;
  final String? paymentStatus;
  final Vendor? vendor;
  final User? customer;
  final User? rider;
  final List<OrderItem> items;
  final List<Rating> ratings;
  final List<RiderRating> riderRatings;
  final String createdAt;
  final String updatedAt;
  final String orderType; // 'DELIVERY' | 'PICKUP'

  Order({
    required this.id,
    required this.customerId,
    required this.vendorId,
    this.riderId,
    required this.status,
    required this.totalAmount,
    required this.deliveryAddress,
    this.deliveryLat,
    this.deliveryLng,
    this.riderLat,
    this.riderLng,
    this.notes,
    this.paymentMethod,
    this.paymentStatus,
    this.vendor,
    this.customer,
    this.rider,
    required this.items,
    this.ratings = const [],
    this.riderRatings = const [],
    required this.createdAt,
    required this.updatedAt,
    this.orderType = 'DELIVERY',
  });

  // Helper getter to check if the order has been rated
  bool get isRated => ratings.isNotEmpty;

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['id'],
      customerId: json['customerId'],
      vendorId: json['vendorId'],
      riderId: json['riderId'],
      status: json['status'],
      totalAmount: (json['totalAmount'] as num).toDouble(),
      deliveryAddress: json['deliveryAddress'] ?? json['street'] ?? 'No address provided',
      deliveryLat: json['deliveryLat'] != null ? (json['deliveryLat'] as num).toDouble() : null,
      deliveryLng: json['deliveryLng'] != null ? (json['deliveryLng'] as num).toDouble() : null,
      riderLat: json['riderLat'] != null ? (json['riderLat'] as num).toDouble() : null,
      riderLng: json['riderLng'] != null ? (json['riderLng'] as num).toDouble() : null,
      notes: json['notes'],
      paymentMethod: json['paymentMethod'],
      paymentStatus: json['paymentStatus'],
      vendor: json['vendor'] != null ? Vendor.fromJson(json['vendor']) : null,
      customer: json['customer'] != null ? User.fromJson(json['customer']) : null,
      rider: json['rider'] != null ? User.fromJson(json['rider']) : null,
      items: json['items'] != null
          ? (json['items'] as List).map((i) => OrderItem.fromJson(i)).toList()
          : [],
      ratings: json['ratings'] != null
          ? (json['ratings'] as List).map((r) => Rating.fromJson(r)).toList()
          : [],
      riderRatings: json['riderRatings'] != null
          ? (json['riderRatings'] as List).map((r) => RiderRating.fromJson(r)).toList()
          : [],
      createdAt: json['createdAt'],
      updatedAt: json['updatedAt'],
      orderType: json['orderType'] ?? 'DELIVERY',
    );
  }

  // --- SQLite Serialization ---
  Map<String, dynamic> toSqlMap() {
    return {
      'id': id,
      'customerId': customerId,
      'vendorId': vendorId,
      'riderId': riderId,
      'status': status,
      'totalAmount': totalAmount,
      'deliveryAddress': deliveryAddress,
      'deliveryLat': deliveryLat,
      'deliveryLng': deliveryLng,
      'paymentMethod': paymentMethod,
      'notes': notes,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
      'vendorJson': vendor != null ? jsonEncode(vendor!.toJson()) : null,
      'itemsJson': jsonEncode(items.map((i) => i.toJson()).toList()),
    };
  }

  factory Order.fromSqlMap(Map<String, dynamic> map) {
    Vendor? vendor;
    if (map['vendorJson'] != null && map['vendorJson'].toString().isNotEmpty) {
      vendor = Vendor.fromJson(jsonDecode(map['vendorJson']));
    }

    List<OrderItem> items = [];
    if (map['itemsJson'] != null && map['itemsJson'].toString().isNotEmpty) {
      final List decodedList = jsonDecode(map['itemsJson']);
      items = decodedList.map((i) => OrderItem.fromJson(i)).toList();
    }

    return Order(
      id: map['id'],
      customerId: map['customerId'],
      vendorId: map['vendorId'],
      riderId: map['riderId'],
      status: map['status'],
      totalAmount: (map['totalAmount'] as num).toDouble(),
      deliveryAddress: map['deliveryAddress'] ?? 'No address',
      deliveryLat: map['deliveryLat'] != null ? (map['deliveryLat'] as num).toDouble() : null,
      deliveryLng: map['deliveryLng'] != null ? (map['deliveryLng'] as num).toDouble() : null,
      paymentMethod: map['paymentMethod'],
      notes: map['notes'],
      createdAt: map['createdAt'] ?? '',
      updatedAt: map['updatedAt'] ?? '',
      vendor: vendor,
      items: items,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'customerId': customerId,
      'vendorId': vendorId,
      'riderId': riderId,
      'status': status,
      'totalAmount': totalAmount,
      'deliveryAddress': deliveryAddress,
      'deliveryLat': deliveryLat,
      'deliveryLng': deliveryLng,
      'riderLat': riderLat,
      'riderLng': riderLng,
      'notes': notes,
      'paymentMethod': paymentMethod,
      'paymentStatus': paymentStatus,
      'items': items.map((i) => i.toJson()).toList(),
      'createdAt': createdAt,
      'updatedAt': updatedAt,
      'orderType': orderType,
    };
  }
}
