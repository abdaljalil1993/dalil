import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/prefs/prefs_providers.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../catalog/domain/entities/category.dart';

class CategoryGrid extends ConsumerWidget {
  final List<Category> categories;

  const CategoryGrid({super.key, required this.categories});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locale = ref.watch(localeProvider);
    final theme = Theme.of(context);

    // Show first 8 categories
    final displayCategories = categories.take(8).toList();

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 20),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 4,
        mainAxisSpacing: 16,
        crossAxisSpacing: 16,
        childAspectRatio: 0.85,
      ),
      itemCount: displayCategories.length,
      itemBuilder: (context, index) {
        final category = displayCategories[index];
        return _CategoryCard(
          category: category,
          locale: locale.languageCode,
          theme: theme,
        );
      },
    );
  }
}

class _CategoryCard extends StatelessWidget {
  final Category category;
  final String locale;
  final ThemeData theme;

  const _CategoryCard({
    required this.category,
    required this.locale,
    required this.theme,
  });

  @override
  Widget build(BuildContext context) {
    final categoryColor = _parseColor(category.color) ?? AppColors.primary;

    return GestureDetector(
      onTap: () {
        context.push('/categories/${category.slug}');
      },
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: categoryColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: categoryColor.withValues(alpha: 0.2),
              ),
            ),
            child: Center(
              child: _buildIcon(categoryColor),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            category.localizedName(locale),
            style: theme.textTheme.labelMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
            maxLines: 2,
            textAlign: TextAlign.center,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildIcon(Color color) {
    // Map icon name to IconData
    final iconData = _getIconData(category.icon);
    
    return Icon(
      iconData,
      color: color,
      size: 28,
    );
  }

  IconData _getIconData(String? iconName) {
    // Common mappings (extend as needed)
    final iconMap = {
      'medical_services': Icons.medical_services,
      'restaurant': Icons.restaurant,
      'hotel': Icons.hotel,
      'gavel': Icons.gavel,
      'build': Icons.build,
      'local_shipping': Icons.local_shipping,
      'cleaning_services': Icons.cleaning_services,
      'celebration': Icons.celebration,
      'shopping_cart': Icons.shopping_cart,
      'fitness_center': Icons.fitness_center,
      'school': Icons.school,
      'car_repair': Icons.car_repair,
      'home_repair_service': Icons.home_repair_service,
      'local_laundry_service': Icons.local_laundry_service,
      'spa': Icons.spa,
      'pets': Icons.pets,
      'storefront': Icons.storefront,
    };

    return iconMap[iconName] ?? Icons.category;
  }

  Color? _parseColor(String? colorString) {
    if (colorString == null || colorString.isEmpty) return null;
    
    try {
      // Remove # if present
      final hex = colorString.replaceAll('#', '');
      
      // Handle 6-digit hex
      if (hex.length == 6) {
        return Color(int.parse('FF$hex', radix: 16));
      }
      
      // Handle 8-digit hex (with alpha)
      if (hex.length == 8) {
        return Color(int.parse(hex, radix: 16));
      }
    } catch (e) {
      // Return null if parsing fails
    }
    
    return null;
  }
}
