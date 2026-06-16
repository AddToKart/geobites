import 'package:flutter/material.dart';
import '../theme/glass_theme.dart';
import 'animated_tap_card.dart';

class PaginationControls extends StatelessWidget {
  final int currentPage;
  final int totalPages;
  final ValueChanged<int> onPageChanged;
  final double bottomPadding;

  const PaginationControls({
    Key? key,
    required this.currentPage,
    required this.totalPages,
    required this.onPageChanged,
    this.bottomPadding = 130.0, // Default padding to clear bottom nav bars
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (totalPages <= 1) return const SizedBox.shrink();

    // Determine which page numbers to show
    List<int> visiblePages = [];
    if (totalPages <= 5) {
      visiblePages = List.generate(totalPages, (index) => index);
    } else {
      if (currentPage < 2) {
        visiblePages = [0, 1, 2, 3, 4];
      } else if (currentPage > totalPages - 3) {
        visiblePages = [totalPages - 5, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1];
      } else {
        visiblePages = [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
      }
    }

    return Container(
      padding: EdgeInsets.only(left: 16, right: 16, top: 16, bottom: bottomPadding),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Previous Button
          _buildControlButton(
            context,
            icon: Icons.chevron_left,
            isEnabled: currentPage > 0,
            onTap: () => onPageChanged(currentPage - 1),
          ),
          const SizedBox(width: 8),

          // Page Numbers
          ...visiblePages.map((pageIndex) {
            final isActive = pageIndex == currentPage;
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4.0),
              child: AnimatedTapCard(
                onTap: () => onPageChanged(pageIndex),
                child: Container(
                  width: 40,
                  height: 40,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: isActive ? AppColors.primary : Colors.transparent,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: isActive ? AppColors.primary : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.2),
                      width: 1.5,
                    ),
                  ),
                  child: Text(
                    '${pageIndex + 1}',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: isActive ? Colors.white : Theme.of(context).colorScheme.onSurface,
                    ),
                  ),
                ),
              ),
            );
          }).toList(),

          const SizedBox(width: 8),
          // Next Button
          _buildControlButton(
            context,
            icon: Icons.chevron_right,
            isEnabled: currentPage < totalPages - 1,
            onTap: () => onPageChanged(currentPage + 1),
          ),
        ],
      ),
    );
  }

  Widget _buildControlButton(BuildContext context, {required IconData icon, required bool isEnabled, required VoidCallback onTap}) {
    final buttonContainer = Container(
      width: 40,
      height: 40,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isEnabled ? Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.2) : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.05),
          width: 1.5,
        ),
      ),
      child: Icon(
        icon,
        color: isEnabled ? Theme.of(context).colorScheme.onSurface : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.3),
      ),
    );

    if (!isEnabled) {
      return buttonContainer;
    }

    return AnimatedTapCard(
      onTap: onTap,
      child: buttonContainer,
    );
  }
}
