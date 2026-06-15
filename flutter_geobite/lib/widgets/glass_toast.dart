import 'package:flutter/material.dart';
import 'dart:ui';
import '../theme/glass_theme.dart';

class GlassToast {
  static void show(BuildContext context, String title, {String? description, IconData? icon, Color? color}) {
    final themeColor = color ?? AppColors.primary;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(16),
        duration: const Duration(seconds: 3),
        content: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1A1A1A).withValues(alpha: 0.6) : Colors.white.withValues(alpha: 0.6),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: themeColor.withValues(alpha: 0.5), width: 1),
                boxShadow: [
                  BoxShadow(
                    color: themeColor.withValues(alpha: 0.15),
                    blurRadius: 20,
                    spreadRadius: 1,
                  ),
                ],
              ),
              child: Row(
                children: [
                  if (icon != null) ...[
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: themeColor.withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(icon, color: themeColor, size: 20),
                    ),
                    const SizedBox(width: 12),
                  ],
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          title,
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: isDark ? Colors.white : Colors.black87,
                            fontSize: 14,
                          ),
                        ),
                        if (description != null) ...[
                          const SizedBox(height: 2),
                          Text(
                            description,
                            style: TextStyle(
                              color: isDark ? Colors.white70 : Colors.black54,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  static void success(BuildContext context, String title, {String? description}) {
    show(context, title, description: description, icon: Icons.check_circle_outline, color: Colors.green);
  }

  static void error(BuildContext context, String title, {String? description}) {
    show(context, title, description: description, icon: Icons.error_outline, color: Colors.red);
  }

  static void info(BuildContext context, String title, {String? description}) {
    show(context, title, description: description, icon: Icons.info_outline, color: Colors.blue);
  }
}
