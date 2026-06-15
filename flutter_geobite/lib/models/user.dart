class User {
  final String id;
  final String email;
  final String name;
  final String role;
  String? phone;
  String? address;
  String? defaultAddress;
  double? defaultLat;
  double? defaultLng;

  User({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    this.phone,
    this.address,
    this.defaultAddress,
    this.defaultLat,
    this.defaultLng,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      email: json['email'],
      name: json['name'],
      role: json['role'],
      phone: json['phone'],
      address: json['address'],
      defaultAddress: json['defaultAddress'],
      defaultLat: json['defaultLat'] != null ? (json['defaultLat'] as num).toDouble() : null,
      defaultLng: json['defaultLng'] != null ? (json['defaultLng'] as num).toDouble() : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'role': role,
      'phone': phone,
      'address': address,
      'defaultAddress': defaultAddress,
      'defaultLat': defaultLat,
      'defaultLng': defaultLng,
    };
  }
}
