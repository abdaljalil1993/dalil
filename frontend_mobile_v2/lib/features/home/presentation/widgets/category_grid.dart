import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/prefs/prefs_providers.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/category_icons.dart';
import '../../../../core/widgets/scroll_reveal.dart';
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
        return ScrollReveal(
          index: index,
          slide: const Offset(0, 0.1),
          child: _CategoryCard(
            category: category,
            locale: locale.languageCode,
            theme: theme,
          ),
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
    final categoryColor = parseHexColor(category.color) ?? AppColors.primary;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => context.push('/categories/${category.slug}'),
        child: Padding(
          padding: const EdgeInsets.all(4),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  // Tinted gradient tile derived from the category color.
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      categoryColor.withValues(alpha: 0.18),
                      categoryColor.withValues(alpha: 0.07),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: categoryColor.withValues(alpha: 0.3),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: categoryColor.withValues(alpha: 0.12),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
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
        ),
      ),
    );
  }

  Widget _buildIcon(Color color) =>
      Icon(categoryIcon(category.icon), color: color, size: 28);
}
