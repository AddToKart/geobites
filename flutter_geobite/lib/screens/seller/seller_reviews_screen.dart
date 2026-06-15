import 'package:flutter/material.dart';
import '../../theme/glass_theme.dart';

class SellerReviewsScreen extends StatelessWidget {
  const SellerReviewsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: GlassAppBar(title: const Text('Reviews')),
      body: const Center(child: Text('Reviews Coming Soon...')),
    );
  }
}
