class OperatingHour {
  final int dayOfWeek;
  final String openTime;
  final String closeTime;
  final bool isClosed;

  OperatingHour({
    required this.dayOfWeek,
    required this.openTime,
    required this.closeTime,
    required this.isClosed,
  });

  factory OperatingHour.fromJson(Map<String, dynamic> json) {
    return OperatingHour(
      dayOfWeek: json['dayOfWeek'] ?? 0,
      openTime: json['openTime'] ?? '08:00',
      closeTime: json['closeTime'] ?? '17:00',
      isClosed: json['isClosed'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'dayOfWeek': dayOfWeek,
      'openTime': openTime,
      'closeTime': closeTime,
      'isClosed': isClosed,
    };
  }
}

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
  final bool isTemporarilyClosed;
  final String? openTime;
  final String? closeTime;
  final List<OperatingHour>? operatingHours;
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
    this.isTemporarilyClosed = false,
    this.openTime,
    this.closeTime,
    this.operatingHours,
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
      isTemporarilyClosed: json['isTemporarilyClosed'] ?? false,
      openTime: json['openTime'],
      closeTime: json['closeTime'],
      operatingHours: json['operatingHours'] != null
          ? (json['operatingHours'] as List)
              .map((item) => OperatingHour.fromJson(item))
              .toList()
          : null,
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
      'isTemporarilyClosed': isTemporarilyClosed,
      'openTime': openTime,
      'closeTime': closeTime,
      'operatingHours': operatingHours?.map((item) => item.toJson()).toList(),
      'createdAt': createdAt,
      'updatedAt': updatedAt,
    };
  }
}
