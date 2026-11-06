import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/l10n/app_localizations.dart';
import '../../../../core/widgets/skeletons.dart';
import '../../providers/category_providers.dart';
import '../../../businesses/providers/business_providers.dart';
import '../../../businesses/presentation/widgets/business_card.dart';
import '../widgets/subcategory_chip.dart';
import '../widgets/filter_bottom_sheet.dart';

class CategoryDetailsScreen extends ConsumerStatefulWidget {
  final String slug;

  const CategoryDetailsScreen({
    super.key,
    required this.slug,
  });

  @override
  ConsumerState<CategoryDetailsScreen> createState() =>
      _CategoryDetailsScreenState();
}

class _CategoryDetailsScreenState extends ConsumerState<CategoryDetailsScreen> {
  int? _selectedSubCategoryId;
  bool _openNow = false;
  String _sortBy = 'recommended';

  @override
  Widget build(BuildContext context) {
    final categoryAsync = ref.watch(categoryDetailsProvider(widget.slug));
    final l10n = AppLocalizations.of(context);

    return Scaffold(
      body: categoryAsync.when(
        data: (category) {
          // Get businesses for this category
          final businessesAsync = ref.watch(
            businessesByCategoryProvider((
              categoryId: category.id,
              subCategoryId: _selectedSubCategoryId,
              cityId: null,
              openNow: _openNow,
              sortBy: _sortBy,
            )),
          );

          return CustomScrollView(
            slivers: [
              // App Bar
              SliverAppBar(
                expandedHeight: 200,
                pinned: true,
                flexibleSpace: FlexibleSpaceBar(
                  title: Text(
                    category.name,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      shadows: [
                        Shadow(
                          offset: Offset(0, 1),
                          blurRadius: 3,
                          color: Colors.black45,
                        ),
                      ],
                    ),
                  ),
                  background: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          Theme.of(context).colorScheme.primary,
                          Theme.of(context).colorScheme.secondary,
                        ],
                      ),
                    ),
                    child: category.icon != null && category.icon!.isNotEmpty
                        ? Center(
                            child: Text(
                              category.icon!,
                              style: const TextStyle(fontSize: 80),
                            ),
                          )
                        : null,
                  ),
                ),
              ),

              // Subcategories (if any)
              if (category.subCategories.isNotEmpty)
                SliverToBoxAdapter(
                  child: Container(
                    height: 60,
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: category.subCategories.length + 1,
                      separatorBuilder: (context, index) =>
                          const SizedBox(width: 8),
                      itemBuilder: (context, index) {
                        if (index == 0) {
                          // "All" chip
                          return SubCategoryChip(
                            label: l10n.all,
                            isSelected: _selectedSubCategoryId == null,
                            onTap: () {
                              setState(() {
                                _selectedSubCategoryId = null;
                              });
                            },
                          );
                        }

                        final subCategory = category.subCategories[index - 1];
                        return SubCategoryChip(
                          label: subCategory.name,
                          isSelected:
                              _selectedSubCategoryId == subCategory.id,
                          onTap: () {
                            setState(() {
                              _selectedSubCategoryId = subCategory.id;
                            });
                          },
                        );
                      },
                    ),
                  ),
                ),

              // Filter Bar
              SliverToBoxAdapter(
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Row(
                    children: [
                      // Open Now Filter
                      FilterChip(
                        label: Text(l10n.openNow),
                        selected: _openNow,
                        onSelected: (selected) {
                          setState(() {
                            _openNow = selected;
                          });
                        },
                        avatar: Icon(
                          Icons.access_time,
                          size: 18,
                          color: _openNow
                              ? Theme.of(context).colorScheme.onSecondaryContainer
                              : null,
                        ),
                      ),
                      const SizedBox(width: 8),

                      // Sort Button
                      OutlinedButton.icon(
                        onPressed: () {
                          _showFilterSheet(context);
                        },
                        icon: const Icon(Icons.sort, size: 20),
                        label: Text(_getSortLabel(_sortBy, l10n)),
                      ),

                      const Spacer(),

                      // Results count
                      businessesAsync.maybeWhen(
                        data: (businesses) => Text(
                          '${businesses.length} ${l10n.results}',
                          style:
                              Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: Theme.of(context).colorScheme.outline,
                                  ),
                        ),
                        orElse: () => const SizedBox.shrink(),
                      ),
                    ],
                  ),
                ),
              ),

              // Business List
              businessesAsync.when(
                data: (businesses) {
                  if (businesses.isEmpty) {
                    return SliverFillRemaining(
                      child: Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.business_outlined,
                              size: 64,
                              color: Theme.of(context).colorScheme.outline,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              l10n.noBusinessesFound,
                              style: Theme.of(context)
                                  .textTheme
                                  .titleMedium
                                  ?.copyWith(
                                    color: Theme.of(context).colorScheme.outline,
                                  ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }

                  return SliverPadding(
                    padding: const EdgeInsets.all(16),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final business = businesses[index];
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: BusinessCard(
                              business: business,
                              onTap: () {
                                context.push('/businesses/${business.slug}');
                              },
                            ),
                          );
                        },
                        childCount: businesses.length,
                      ),
                    ),
                  );
                },
                loading: () => const SliverFillRemaining(
                  child: Center(child: CircularProgressIndicator()),
                ),
                error: (error, stack) => SliverFillRemaining(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.error_outline,
                          size: 64,
                          color: Theme.of(context).colorScheme.error,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          error is Failure
                              ? error.message
                              : 'حدث خطأ غير متوقع',
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.bodyLarge,
                        ),
                        const SizedBox(height: 16),
                        FilledButton.icon(
                          onPressed: () => ref.invalidate(
                            businessesByCategoryProvider((
                              categoryId: category.id,
                              subCategoryId: _selectedSubCategoryId,
                              cityId: null,
                              openNow: _openNow,
                              sortBy: _sortBy,
                            )),
                          ),
                          icon: const Icon(Icons.refresh),
                          label: Text(l10n.retry),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          );
        },
        loading: () => const DetailsSkeleton(),
        error: (error, stack) => Scaffold(
          appBar: AppBar(),
          body: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.error_outline,
                  size: 64,
                  color: Theme.of(context).colorScheme.error,
                ),
                const SizedBox(height: 16),
                Text(
                  error is Failure ? error.message : 'حدث خطأ غير متوقع',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
                const SizedBox(height: 16),
                FilledButton.icon(
                  onPressed: () =>
                      ref.invalidate(categoryDetailsProvider(widget.slug)),
                  icon: const Icon(Icons.refresh),
                  label: Text(l10n.retry),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showFilterSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) => FilterBottomSheet(
        currentSort: _sortBy,
        onSortChanged: (newSort) {
          setState(() {
            _sortBy = newSort;
          });
          Navigator.pop(context);
        },
      ),
    );
  }

  String _getSortLabel(String sortBy, AppLocalizations l10n) {
    switch (sortBy) {
      case 'recommended':
        return l10n.recommended;
      case 'rating':
        return l10n.highestRated;
      case 'newest':
        return l10n.newest;
      case 'name':
        return l10n.name;
      default:
        return l10n.sortBy;
    }
  }
}
