class Rating {
  final String id;
  final int score;
  final String? feedback;
  final String customerName;
  final String createdAt;

  Rating({
    required this.id,
    required this.score,
    this.feedback,
    required this.customerName,
    required this.createdAt,
  });

  factory Rating.fromJson(Map<String, dynamic> json) {
    return Rating(
      id: json['id'] ?? '',
      score: (json['score'] as num?)?.toInt() ?? 0,
      feedback: json['feedback'],
      customerName: json['customerName'] ?? 'Customer',
      createdAt: json['createdAt'] ?? DateTime.now().toIso8601String(),
    );
  }
}

class VendorRatingSummary {
  final double averageScore;
  final int totalRatings;
  final List<Rating> ratings;

  VendorRatingSummary({
    required this.averageScore,
    required this.totalRatings,
    required this.ratings,
  });

  factory VendorRatingSummary.fromJson(Map<String, dynamic> json) {
    return VendorRatingSummary(
      averageScore: (json['averageScore'] as num?)?.toDouble() ?? 0.0,
      totalRatings: (json['totalRatings'] as num?)?.toInt() ?? 0,
      ratings: (json['ratings'] as List<dynamic>?)
              ?.map((e) => Rating.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}
