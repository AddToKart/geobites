import 'package:flutter/material.dart';
import '../../theme/glass_theme.dart';

class SellerKdsScreen extends StatelessWidget {
  const SellerKdsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: GlassAppBar(title: const Text('Kitchen Display System')),
      body: const Center(child: Text('KDS Coming Soon...')),
    );
  }
}
