class MenuItem {
  final String id;
  final String vendorId;
  final String name;
  final String? description;
  final double price;
  final String? category;
  final String? imageUrl;
  final bool isAvailable;
  final String createdAt;
  final String updatedAt;

  MenuItem({
    required this.id,
    required this.vendorId,
    required this.name,
    this.description,
    required this.price,
    this.category,
    this.imageUrl,
    required this.isAvailable,
    required this.createdAt,
    required this.updatedAt,
  });

  factory MenuItem.fromJson(Map<String, dynamic> json) {
    return MenuItem(
      id: json['id'],
      vendorId: json['vendorId'],
      name: json['name'],
      description: json['description'],
      price: (json['price'] as num).toDouble(),
      category: json['category'],
      imageUrl: json['imageUrl'],
      isAvailable: json['isAvailable'] ?? true,
      createdAt: json['createdAt'],
      updatedAt: json['updatedAt'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'vendorId': vendorId,
      'name': name,
      'description': description,
      'price': price,
      'category': category,
      'imageUrl': imageUrl,
      'isAvailable': isAvailable,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
    };
  }
}
