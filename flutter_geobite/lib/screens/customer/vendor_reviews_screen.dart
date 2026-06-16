import 'package:flutter/material.dart';
import '../../models/vendor.dart';
import '../../models/rating.dart';
import '../../services/rating_service.dart';
import '../../theme/glass_theme.dart';
import '../../widgets/pagination_controls.dart';
import 'package:intl/intl.dart';

class VendorReviewsScreen extends StatefulWidget {
  final Vendor vendor;

  const VendorReviewsScreen({Key? key, required this.vendor}) : super(key: key);

  @override
  _VendorReviewsScreenState createState() => _VendorReviewsScreenState();
}

class _VendorReviewsScreenState extends State<VendorReviewsScreen> {
  VendorRatingSummary? _summary;
  bool _isLoading = true;
  int _currentPage = 0;
  static const int _itemsPerPage = 10;

  @override
  void initState() {
    super.initState();
    _loadRatings();
  }

  Future<void> _loadRatings() async {
    try {
      final summary = await ratingService.getVendorRatings(widget.vendor.id);
      setState(() {
        _summary = summary;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const GlassScaffold(
        appBar: GlassAppBar(title: Text('Store Reviews')),
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_summary == null || _summary!.ratings.isEmpty) {
      return const GlassScaffold(
        appBar: GlassAppBar(title: Text('Store Reviews')),
        body: Center(child: Text('No reviews yet. Be the first to order!')),
      );
    }

    final int totalPages = (_summary!.ratings.length / _itemsPerPage).ceil();
    final paginatedRatings = _summary!.ratings.skip(_currentPage * _itemsPerPage).take(_itemsPerPage).toList();

    return GlassScaffold(
      appBar: GlassAppBar(title: Text('${widget.vendor.name} Reviews')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: NeumorphicCard(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Column(
                    children: [
                      Text(
                        _summary!.averageScore.toStringAsFixed(1),
                        style: const TextStyle(fontSize: 48, fontWeight: FontWeight.bold, color: AppColors.primary),
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(5, (index) {
                          return Icon(
                            index < _summary!.averageScore.round() ? Icons.star : Icons.star_border,
                            color: Colors.orange,
                            size: 24,
                          );
                        }),
                      ),
                      const SizedBox(height: 8),
                      Text('Based on ${_summary!.totalRatings} reviews', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6))),
                    ],
                  ),
                ],
              ),
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              itemCount: paginatedRatings.length,
              itemBuilder: (context, index) {
                final rating = paginatedRatings[index];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12.0),
                  child: NeumorphicCard(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                CircleAvatar(
                                  radius: 16,
                                  backgroundColor: AppColors.primary.withValues(alpha: 0.2),
                                  child: const Icon(Icons.person, size: 20, color: AppColors.primary),
                                ),
                                const SizedBox(width: 8),
                                Text(rating.customerName, style: const TextStyle(fontWeight: FontWeight.bold)),
                              ],
                            ),
                            Text(
                              DateFormat('MMM d, yyyy').format(DateTime.tryParse(rating.createdAt)?.toLocal() ?? DateTime.now()),
                              style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: List.generate(5, (starIndex) {
                            return Icon(
                              starIndex < rating.score ? Icons.star : Icons.star_border,
                              color: Colors.orange,
                              size: 16,
                            );
                          }),
                        ),
                        if (rating.feedback != null && rating.feedback!.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Text(rating.feedback!, style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.8))),
                        ],
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          if (totalPages > 1)
            PaginationControls(
              currentPage: _currentPage,
              totalPages: totalPages,
              bottomPadding: 32.0, // Since no bottom nav bar on this screen
              onPageChanged: (page) => setState(() => _currentPage = page),
            ),
        ],
      ),
    );
  }
}
