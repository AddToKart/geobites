class Vendor {
  final String id;
  final String userId;
  final String name;
  final String? description;
  final String address;
  final double latitude;
  final double longitude;
  final double rating;
  final int totalRatings;
  final String? imageUrl;
  final bool isActive;
  final String createdAt;
  final String updatedAt;

  Vendor({
    required this.id,
    required this.userId,
    required this.name,
    this.description,
    required this.address,
    required this.latitude,
    required this.longitude,
    required this.rating,
    required this.totalRatings,
    this.imageUrl,
    required this.isActive,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Vendor.fromJson(Map<String, dynamic> json) {
    return Vendor(
      id: json['id'],
      userId: json['userId'],
      name: json['name'],
      description: json['description'],
      address: json['address'],
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      rating: (json['rating'] as num).toDouble(),
      totalRatings: json['totalRatings'] ?? 0,
      imageUrl: json['imageUrl'],
      isActive: json['isActive'] ?? true,
      createdAt: json['createdAt'],
      updatedAt: json['updatedAt'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'name': name,
      'description': description,
      'address': address,
      'latitude': latitude,
      'longitude': longitude,
      'rating': rating,
      'totalRatings': totalRatings,
      'imageUrl': imageUrl,
      'isActive': isActive,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
    };
  }
}
