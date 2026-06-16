class RiderRating {
  final String id;
  final String orderId;
  final String raterId;
  final String raterRole; // 'customer' | 'seller'
  final String riderId;
  final int score;
  final String? feedback;
  final String createdAt;

  RiderRating({
    required this.id,
    required this.orderId,
    required this.raterId,
    required this.raterRole,
    required this.riderId,
    required this.score,
    this.feedback,
    required this.createdAt,
  });

  factory RiderRating.fromJson(Map<String, dynamic> json) {
    return RiderRating(
      id: json['id'] ?? '',
      orderId: json['orderId'] ?? '',
      raterId: json['raterId'] ?? '',
      raterRole: json['raterRole'] ?? '',
      riderId: json['riderId'] ?? '',
      score: (json['score'] as num?)?.toInt() ?? 0,
      feedback: json['feedback'],
      createdAt: json['createdAt'] ?? DateTime.now().toIso8601String(),
    );
  }
}
