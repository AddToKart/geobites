import 'dart:ui';
import 'package:flutter/material.dart';

class AppColors {
  // Brand Colors
  static const Color primary = Color(0xFFFF8B00); // Vibrant Orange
  static const Color primaryLight = Color(0xFFFFAA00); // Yellow-Orange
  static const Color primaryDark = Color(0xFFE67A00);

  // Dark Theme Colors
  static const Color darkBg = Color(0xFF1E1F24);
  static const Color darkCard = Color(0xFF2A2C31);
  static const Color darkTextPrimary = Color(0xFFF8FAFC);
  static const Color darkTextSecondary = Color(0xFF94A3B8);

  // Light Theme Colors
  static const Color lightBg = Color(0xFFF0F3F8); // Slight cool off-white for neumorphism
  static const Color lightCard = Color(0xFFF0F3F8);
  static const Color lightTextPrimary = Color(0xFF0F172A);
  static const Color lightTextSecondary = Color(0xFF64748B);

  // Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [primary, primaryLight],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static LinearGradient subtleGradient(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return LinearGradient(
      colors: isDark
          ? [const Color(0xFF32353B), const Color(0xFF26282D)]
          : [const Color(0xFFFFFFFF), const Color(0xFFE6EBF2)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    );
  }
}

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      brightness: Brightness.light,
      primaryColor: AppColors.primary,
      scaffoldBackgroundColor: AppColors.lightBg,
      fontFamily: 'Outfit',
      colorScheme: const ColorScheme.light(
        primary: AppColors.primary,
        secondary: AppColors.primaryLight,
        background: AppColors.lightBg,
        surface: AppColors.lightCard,
        onPrimary: Colors.white,
        onBackground: AppColors.lightTextPrimary,
        onSurface: AppColors.lightTextPrimary,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: IconThemeData(color: AppColors.lightTextPrimary),
        titleTextStyle: TextStyle(color: AppColors.lightTextPrimary, fontSize: 20, fontWeight: FontWeight.bold, fontFamily: 'Outfit'),
      ),
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      primaryColor: AppColors.primary,
      scaffoldBackgroundColor: AppColors.darkBg,
      fontFamily: 'Outfit',
      colorScheme: const ColorScheme.dark(
        primary: AppColors.primary,
        secondary: AppColors.primaryLight,
        background: AppColors.darkBg,
        surface: AppColors.darkCard,
        onPrimary: Colors.white,
        onBackground: AppColors.darkTextPrimary,
        onSurface: AppColors.darkTextPrimary,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: IconThemeData(color: AppColors.darkTextPrimary),
        titleTextStyle: TextStyle(color: AppColors.darkTextPrimary, fontSize: 20, fontWeight: FontWeight.bold, fontFamily: 'Outfit'),
      ),
    );
  }
}

/// A strictly Neumorphic Card that dynamically adapts to Light/Dark mode.
class NeumorphicCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final double borderRadius;
  final bool isPressed;
  final bool useGradient;

  const NeumorphicCard({
    Key? key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.borderRadius = 24.0,
    this.isPressed = false,
    this.useGradient = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    // Shadows
    final lightShadowColor = isDark ? Colors.white.withValues(alpha: 0.05) : Colors.white;
    final darkShadowColor = isDark ? Colors.black.withValues(alpha: 0.5) : const Color(0xFFA6B4C8).withValues(alpha: 0.6);
    
    // Background color
    final bgColor = isDark ? AppColors.darkCard : AppColors.lightCard;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 150),
      padding: padding,
      decoration: BoxDecoration(
        color: useGradient ? null : bgColor,
        gradient: useGradient ? AppColors.primaryGradient : null,
        borderRadius: BorderRadius.circular(borderRadius),
        boxShadow: isPressed
            ? null // If pressed, we remove drop shadows to simulate it being pushed in
            : [
                // Bottom Right Dark Shadow
                BoxShadow(
                  color: useGradient ? AppColors.primaryDark.withValues(alpha: 0.5) : darkShadowColor,
                  offset: const Offset(6, 6),
                  blurRadius: 16,
                  spreadRadius: 1,
                ),
                // Top Left Light Shadow
                BoxShadow(
                  color: useGradient ? AppColors.primaryLight.withValues(alpha: 0.5) : lightShadowColor,
                  offset: const Offset(-6, -6),
                  blurRadius: 16,
                  spreadRadius: 1,
                ),
              ],
      ),
      child: child,
    );
  }
}

/// The base scaffold containing ambient gradients.
class GlassScaffold extends StatelessWidget {
  final Widget body;
  final PreferredSizeWidget? appBar;
  final Widget? bottomNavigationBar;
  final Widget? floatingActionButton;
  final FloatingActionButtonLocation? floatingActionButtonLocation;
  final bool extendBody;

  const GlassScaffold({
    Key? key,
    required this.body,
    this.appBar,
    this.bottomNavigationBar,
    this.floatingActionButton,
    this.floatingActionButtonLocation,
    this.extendBody = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      extendBody: extendBody,
      appBar: appBar,
      body: Stack(
        children: [
          // Ambient Blob 1 (Top Right)
          Positioned(
            top: -50,
            right: -100,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    AppColors.primary.withValues(alpha: 0.15),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
          // Main Content
          SafeArea(
            bottom: false,
            child: body,
          ),
        ],
      ),
      bottomNavigationBar: bottomNavigationBar,
      floatingActionButton: floatingActionButton,
      floatingActionButtonLocation: floatingActionButtonLocation,
    );
  }
}

class GlassAppBar extends StatelessWidget implements PreferredSizeWidget {
  final Widget? title;
  final List<Widget>? actions;
  final Widget? leading;
  final bool automaticallyImplyLeading;

  const GlassAppBar({
    Key? key,
    this.title,
    this.actions,
    this.leading,
    this.automaticallyImplyLeading = true,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return AppBar(
      backgroundColor: Colors.transparent,
      elevation: 0,
      title: title,
      actions: actions,
      leading: leading,
      automaticallyImplyLeading: automaticallyImplyLeading,
      flexibleSpace: ClipRect(
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
          child: Container(
            decoration: BoxDecoration(
              color: isDark ? AppColors.darkBg.withValues(alpha: 0.6) : AppColors.lightBg.withValues(alpha: 0.6),
              border: Border(
                bottom: BorderSide(
                  color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.05),
                )
              )
            ),
          ),
        ),
      ),
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
