import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  // Brand Colors
  static const Color primary = Color(0xFFFF8B00); // Vibrant Orange
  static const Color primaryLight = Color(0xFFFFAA00); // Yellow-Orange
  static const Color primaryDark = Color(0xFFE67A00);

  // Dark Theme Colors
  static const Color darkBg = Color(0xFF000000); // True Black
  static const Color darkCard = Color(0xFF0A0A0A); // Deepest Grey/Black
  static const Color darkTextPrimary = Color(0xFFF8FAFC);
  static const Color darkTextSecondary = Color(0xFF94A3B8);

  // Light Theme Colors
  static const Color lightBg = Color(0xFFF0F3F8);
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
          ? [const Color(0xFF000000), primary.withValues(alpha: 0.05)]
          : [const Color(0xFFFFFFFF), const Color(0xFFE6EBF2)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    );
  }
}

/// Sharp corner radius — use throughout the app instead of large radii.
const double kSharpRadius = 4.0;

class AppTheme {
  // ---------------------------------------------------------------------------
  // Shared text theme built on Plus Jakarta Sans
  // ---------------------------------------------------------------------------
  static TextTheme _buildTextTheme(Color bodyColor, Color displayColor) {
    final base = GoogleFonts.plusJakartaSansTextTheme(
      TextTheme(
        displayLarge:  TextStyle(color: displayColor, fontWeight: FontWeight.w800, letterSpacing: -1.5),
        displayMedium: TextStyle(color: displayColor, fontWeight: FontWeight.w800, letterSpacing: -0.5),
        displaySmall:  TextStyle(color: displayColor, fontWeight: FontWeight.w700),
        headlineLarge: TextStyle(color: displayColor, fontWeight: FontWeight.w700, letterSpacing: -0.5),
        headlineMedium:TextStyle(color: displayColor, fontWeight: FontWeight.w700),
        headlineSmall: TextStyle(color: displayColor, fontWeight: FontWeight.w600),
        titleLarge:    TextStyle(color: displayColor, fontWeight: FontWeight.w600),
        titleMedium:   TextStyle(color: bodyColor,    fontWeight: FontWeight.w600, letterSpacing: 0.15),
        titleSmall:    TextStyle(color: bodyColor,    fontWeight: FontWeight.w600, letterSpacing: 0.1),
        bodyLarge:     TextStyle(color: bodyColor,    fontWeight: FontWeight.w400),
        bodyMedium:    TextStyle(color: bodyColor,    fontWeight: FontWeight.w400),
        bodySmall:     TextStyle(color: bodyColor,    fontWeight: FontWeight.w400, letterSpacing: 0.4),
        labelLarge:    TextStyle(color: bodyColor,    fontWeight: FontWeight.w700, letterSpacing: 1.0),
        labelMedium:   TextStyle(color: bodyColor,    fontWeight: FontWeight.w600, letterSpacing: 1.2),
        labelSmall:    TextStyle(color: bodyColor,    fontWeight: FontWeight.w600, letterSpacing: 1.5),
      ),
    );
    return base;
  }

  // ---------------------------------------------------------------------------
  // Shared shape — sharp corners everywhere
  // ---------------------------------------------------------------------------
  static const _sharpShape = RoundedRectangleBorder(
    borderRadius: BorderRadius.all(Radius.circular(kSharpRadius)),
  );

  // ---------------------------------------------------------------------------
  // Light Theme
  // ---------------------------------------------------------------------------
  static ThemeData get lightTheme {
    final textTheme = _buildTextTheme(AppColors.lightTextPrimary, AppColors.lightTextPrimary);
    return ThemeData(
      brightness: Brightness.light,
      primaryColor: AppColors.primary,
      scaffoldBackgroundColor: AppColors.lightBg,
      textTheme: textTheme,
      colorScheme: const ColorScheme.light(
        primary: AppColors.primary,
        secondary: AppColors.primaryLight,
        surface: AppColors.lightCard,
        onPrimary: Colors.white,
        onSurface: AppColors.lightTextPrimary,
      ),
      // ── Shape overrides ──────────────────────────────────────────────────
      cardTheme: const CardThemeData(
        shape: _sharpShape,
        elevation: 0,
      ),
      inputDecorationTheme: InputDecorationTheme(
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(kSharpRadius)),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(kSharpRadius),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(kSharpRadius),
          borderSide: BorderSide(color: AppColors.lightTextPrimary.withValues(alpha: 0.15)),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(shape: _sharpShape),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          shape: _sharpShape,
          backgroundColor: AppColors.primary.withValues(alpha: 0.15),
          foregroundColor: AppColors.primary,
          side: BorderSide.none,
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(shape: _sharpShape),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(shape: _sharpShape),
      ),
      chipTheme: ChipThemeData(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(kSharpRadius)),
        side: BorderSide.none,
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(kSharpRadius)),
        ),
      ),
      dialogTheme: const DialogThemeData(shape: _sharpShape),
      snackBarTheme: const SnackBarThemeData(shape: _sharpShape),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.lightTextPrimary),
        titleTextStyle: GoogleFonts.plusJakartaSans(
          color: AppColors.lightTextPrimary,
          fontSize: 20,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.3,
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Dark Theme
  // ---------------------------------------------------------------------------
  static ThemeData get darkTheme {
    final textTheme = _buildTextTheme(AppColors.darkTextPrimary, AppColors.darkTextPrimary);
    return ThemeData(
      brightness: Brightness.dark,
      primaryColor: AppColors.primary,
      scaffoldBackgroundColor: AppColors.darkBg,
      textTheme: textTheme,
      colorScheme: const ColorScheme.dark(
        primary: AppColors.primary,
        secondary: AppColors.primaryLight,
        surface: AppColors.darkCard,
        onPrimary: Colors.white,
        onSurface: AppColors.darkTextPrimary,
      ),
      // ── Shape overrides ──────────────────────────────────────────────────
      cardTheme: const CardThemeData(
        shape: _sharpShape,
        elevation: 0,
      ),
      inputDecorationTheme: InputDecorationTheme(
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(kSharpRadius)),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(kSharpRadius),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(kSharpRadius),
          borderSide: BorderSide(color: AppColors.darkTextPrimary.withValues(alpha: 0.15)),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(shape: _sharpShape),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          shape: _sharpShape,
          backgroundColor: AppColors.primary.withValues(alpha: 0.15),
          foregroundColor: AppColors.primary,
          side: BorderSide.none,
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(shape: _sharpShape),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(shape: _sharpShape),
      ),
      chipTheme: ChipThemeData(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(kSharpRadius)),
        side: BorderSide.none,
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(kSharpRadius)),
        ),
      ),
      dialogTheme: const DialogThemeData(shape: _sharpShape),
      snackBarTheme: const SnackBarThemeData(shape: _sharpShape),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.darkTextPrimary),
        titleTextStyle: GoogleFonts.plusJakartaSans(
          color: AppColors.darkTextPrimary,
          fontSize: 20,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.3,
        ),
      ),
    );
  }
}

/// A strictly Neumorphic Card — sharp corners by default.
class NeumorphicCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final double borderRadius;
  final bool isPressed;
  final bool useGradient;
  final Color? glowColor;

  const NeumorphicCard({
    Key? key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.borderRadius = kSharpRadius,
    this.isPressed = false,
    this.useGradient = false,
    this.glowColor,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final lightShadowColor = isDark ? Colors.transparent : Colors.white;
    final darkShadowColor = isDark ? Colors.transparent : const Color(0xFFA6B4C8).withValues(alpha: 0.6);
    final bgColor = isDark ? AppColors.darkCard : AppColors.lightCard;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 150),
      padding: padding,
      decoration: BoxDecoration(
        color: useGradient ? null : bgColor,
        gradient: useGradient ? AppColors.primaryGradient : null,
        borderRadius: BorderRadius.circular(borderRadius),
        boxShadow: isPressed
            ? null
            : [
                if (isDark)
                  BoxShadow(
                    color: glowColor?.withValues(alpha: 0.15) ?? AppColors.primary.withValues(alpha: 0.03),
                    offset: const Offset(0, 0),
                    blurRadius: 20,
                    spreadRadius: 1,
                  )
                else ...[
                  BoxShadow(
                    color: useGradient ? AppColors.primaryDark.withValues(alpha: 0.5) : darkShadowColor,
                    offset: const Offset(6, 6),
                    blurRadius: 16,
                    spreadRadius: 1,
                  ),
                  BoxShadow(
                    color: useGradient ? AppColors.primaryLight.withValues(alpha: 0.5) : lightShadowColor,
                    offset: const Offset(-6, -6),
                    blurRadius: 16,
                    spreadRadius: 1,
                  ),
                ],
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
          if (Theme.of(context).brightness == Brightness.dark) ...[
            Positioned(
              top: -100,
              left: -100,
              child: Container(
                width: 300,
                height: 300,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.primary.withValues(alpha: 0.05),
                ),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 100, sigmaY: 100),
                  child: Container(color: Colors.transparent),
                ),
              ),
            ),
            Positioned(
              bottom: -50,
              right: -50,
              child: Container(
                width: 250,
                height: 250,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.primaryLight.withValues(alpha: 0.03),
                ),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 80, sigmaY: 80),
                  child: Container(color: Colors.transparent),
                ),
              ),
            ),
          ],
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
              color: isDark
                  ? AppColors.darkBg.withValues(alpha: 0.6)
                  : AppColors.lightBg.withValues(alpha: 0.6),
              border: Border(
                bottom: BorderSide(
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.05)
                      : Colors.black.withValues(alpha: 0.05),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
