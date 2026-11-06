import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/l10n/app_localizations.dart';
import '../../../../core/widgets/skeletons.dart';
import '../../../../core/widgets/status_views.dart';
import '../../providers/category_providers.dart';
import '../widgets/category_tile.dart';

class CategoriesScreen extends ConsumerWidget {
  const CategoriesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categoriesAsync = ref.watch(categoriesProvider);
    final l10n = AppLocalizations.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.categories),
        centerTitle: true,
      ),
      body: categoriesAsync.when(
        data: (categories) {
          if (categories.isEmpty) {
            return const EmptyView(
              message: 'لا توجد تصنيفات بعد',
              icon: Icons.category_outlined,
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: categories.length,
            separatorBuilder: (context, index) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final category = categories[index];
              return CategoryTile(
                category: category,
                onTap: () {
                  context.push('/categories/${category.slug}');
                },
              );
            },
          );
        },
        loading: () => const ListSkeleton(itemCount: 10),
        error: (error, stack) => ErrorView(
          message: error is Failure ? error.message : 'حدث خطأ غير متوقع',
          onRetry: () => ref.invalidate(categoriesProvider),
        ),
      ),
    );
  }
}
