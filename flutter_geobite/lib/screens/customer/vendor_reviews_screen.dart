import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/vendor.dart';
import '../../models/rating.dart';
import '../../models/order.dart';
import '../../services/rating_service.dart';
import '../../services/order_service.dart';
import '../../providers/auth_provider.dart';
import '../../theme/glass_theme.dart';
import '../../widgets/pagination_controls.dart';
import '../../widgets/animated_tap_card.dart';
import '../../widgets/glass_toast.dart';
import 'package:intl/intl.dart';

class VendorReviewsScreen extends StatefulWidget {
  final Vendor vendor;

  const VendorReviewsScreen({super.key, required this.vendor});

  @override
  State<VendorReviewsScreen> createState() => _VendorReviewsScreenState();
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

  Future<void> _checkAndShowReviewDialog(BuildContext context) async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    List<Order> orders = [];
    try {
      orders = await orderService.getOrders(status: 'delivered', limit: 100);
    } catch (e) {
      if (context.mounted) {
        Navigator.pop(context); // Close loading dialog
        GlassToast.error(context, 'Failed to fetch orders: $e');
      }
      return;
    }

    if (context.mounted) {
      Navigator.pop(context); // Close loading dialog
    }

    // Search for any unrated order from this vendor using a safe loop
    Order? unratedOrder;
    for (final o in orders) {
      // Find order matching vendor and not rated yet
      if (o.vendorId == widget.vendor.id && !o.isRated) {
        unratedOrder = o;
        break;
      }
    }

    if (unratedOrder == null) {
      if (context.mounted) {
        GlassToast.error(
          context,
          'You can only review vendors after completing a delivered order from them.',
        );
      }
    } else {
      if (context.mounted) {
        _showRatingDialog(context, unratedOrder.id);
      }
    }
  }

  void _showRatingDialog(BuildContext context, String orderId) {
    int rating = 5;
    final feedbackController = TextEditingController();
    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          return Container(
            padding: EdgeInsets.only(
              left: 24, right: 24, top: 24,
              bottom: MediaQuery.of(context).viewInsets.bottom + 24,
            ),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              border: Border(top: BorderSide(color: Colors.white.withValues(alpha: 0.2))),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('Rate Your Experience', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(5, (index) {
                    return IconButton(
                      icon: Icon(
                        index < rating ? Icons.star : Icons.star_border,
                        color: Colors.orange,
                        size: 40,
                      ),
                      onPressed: () => setModalState(() => rating = index + 1),
                    );
                  }),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: feedbackController,
                  maxLines: 3,
                  decoration: InputDecoration(
                    hintText: 'Tell us about your experience...',
                    filled: true,
                    fillColor: Theme.of(context).brightness == Brightness.dark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.05),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  ),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: isSubmitting ? null : () async {
                      setModalState(() => isSubmitting = true);
                      try {
                        await ratingService.submitRating(orderId, rating, feedbackController.text);
                        if (context.mounted) {
                          Navigator.pop(context);
                          GlassToast.success(context, 'Thank you for your feedback!');
                          _loadRatings(); // Refresh reviews list
                        }
                      } catch (e) {
                        setModalState(() => isSubmitting = false);
                        if (context.mounted) {
                          GlassToast.error(context, e.toString().replaceAll('Exception: Failed to submit rating: ', ''));
                        }
                      }
                    },
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: isSubmitting 
                      ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Text('Submit Review', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white)),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const GlassScaffold(
        appBar: GlassAppBar(title: Text('Store Reviews')),
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final auth = Provider.of<AuthProvider>(context, listen: false);
    final isCustomer = auth.user?.role == 'customer';

    final bool hasReviews = _summary != null && _summary!.ratings.isNotEmpty;
    final double averageScore = _summary?.averageScore ?? 0.0;
    final int totalRatings = _summary?.totalRatings ?? 0;

    final int totalPages = hasReviews ? (_summary!.ratings.length / _itemsPerPage).ceil() : 0;
    final paginatedRatings = hasReviews 
        ? _summary!.ratings.skip(_currentPage * _itemsPerPage).take(_itemsPerPage).toList()
        : [];

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
                        averageScore.toStringAsFixed(1),
                        style: const TextStyle(fontSize: 48, fontWeight: FontWeight.bold, color: AppColors.primary),
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(5, (index) {
                          return Icon(
                            index < averageScore.round() ? Icons.star : Icons.star_border,
                            color: Colors.orange,
                            size: 24,
                          );
                        }),
                      ),
                      const SizedBox(height: 8),
                      Text('Based on $totalRatings reviews', style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6))),
                    ],
                  ),
                ],
              ),
            ),
          ),
          if (!hasReviews)
            Expanded(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.rate_review_outlined,
                        size: 64,
                        color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'No reviews yet',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.8),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Have you ordered from this store? Share your experience!',
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 80), // Spacing for FAB
                    ],
                  ),
                ),
              ),
            )
          else
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.only(left: 16.0, right: 16.0, bottom: 80.0), // bottom padding for FAB
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
              bottomPadding: 32.0,
              onPageChanged: (page) => setState(() => _currentPage = page),
            ),
        ],
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      floatingActionButton: isCustomer
          ? Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: AnimatedTapCard(
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: 0.4),
                        blurRadius: 20,
                        spreadRadius: 2,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: FilledButton.icon(
                    onPressed: () => _checkAndShowReviewDialog(context),
                    icon: const Icon(Icons.rate_review, color: Colors.white),
                    label: const Text('Write a Review', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white)),
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                  ),
                ),
              ),
            )
          : null,
    );
  }
}
