import 'package:flutter/material.dart';
import '../../theme/glass_theme.dart';

class SellerAnalyticsScreen extends StatelessWidget {
  const SellerAnalyticsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: GlassAppBar(title: const Text('Analytics')),
      body: const Center(child: Text('Analytics Coming Soon...')),
    );
  }
}
