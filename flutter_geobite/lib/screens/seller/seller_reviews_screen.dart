import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../models/vendor.dart';
import '../../models/rating.dart';
import '../../services/vendor_service.dart';
import '../../services/rating_service.dart';
import '../../theme/glass_theme.dart';
import '../../widgets/pagination_controls.dart';
import 'package:intl/intl.dart';

class SellerReviewsScreen extends StatefulWidget {
  const SellerReviewsScreen({Key? key}) : super(key: key);

  @override
  _SellerReviewsScreenState createState() => _SellerReviewsScreenState();
}

class _SellerReviewsScreenState extends State<SellerReviewsScreen> {
  Vendor? _vendor;
  VendorRatingSummary? _summary;
  bool _isLoading = true;
  int _currentPage = 0;
  static const int _itemsPerPage = 10;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final vendors = await vendorService.getVendors();
      
      try {
        final myVendor = vendors.firstWhere((v) => v.userId == auth.user?.id);
        _vendor = myVendor;
        
        final summary = await ratingService.getVendorRatings(myVendor.id);
        if (mounted) {
          setState(() {
            _summary = summary;
            _isLoading = false;
          });
        }
      } catch (e) {
        if (mounted) {
          setState(() {
            _summary = null;
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
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

    if (_vendor == null) {
      return const GlassScaffold(
        appBar: GlassAppBar(title: Text('Store Reviews')),
        body: Center(child: Text('Vendor profile not setup.')),
      );
    }

    if (_summary == null || _summary!.ratings.isEmpty) {
      return const GlassScaffold(
        appBar: GlassAppBar(title: Text('Store Reviews')),
        body: Center(child: Text('No reviews yet. Keep up the good work!')),
      );
    }

    final int totalPages = (_summary!.ratings.length / _itemsPerPage).ceil();
    final paginatedRatings = _summary!.ratings.skip(_currentPage * _itemsPerPage).take(_itemsPerPage).toList();

    return GlassScaffold(
      appBar: const GlassAppBar(title: Text('Store Reviews')),
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
