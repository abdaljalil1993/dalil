import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/error/failures.dart';
import '../../../../core/router/app_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/dalilak_app_bar.dart';
import '../../../../core/widgets/section_header.dart';
import '../../../../core/widgets/scroll_reveal.dart';
import '../../../../core/widgets/skeletons.dart';
import '../../../../core/widgets/status_views.dart';
import '../../domain/entities/home_feed.dart';
import '../../providers/home_providers.dart';
import '../widgets/ad_carousel.dart';
import '../widgets/business_section.dart';
import '../widgets/category_grid.dart';
import '../widgets/hero_search_bar.dart';
import '../widgets/quick_services.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final homeFeedAsync = ref.watch(homeFeedProvider);

    return Scaffold(
      appBar: DalilakAppBar(
        actions: [
          IconButton(
            onPressed: () {
              // TODO: Navigate to notifications
            },
            icon: const Icon(Icons.notifications_none_rounded),
            tooltip: 'الإشعارات',
          ),
          IconButton(
            onPressed: () {
              // TODO: Open city selector
            },
            icon: const Icon(Icons.location_on_outlined),
            tooltip: 'اختر المدينة',
          ),
        ],
      ),
      body: AnimatedSwitcher(
          duration: const Duration(milliseconds: 250),
          switchInCurve: Curves.easeOut,
          child: homeFeedAsync.when(
            data: (feed) => RefreshIndicator(
          onRefresh: () async => ref.invalidate(homeFeedProvider),
          child: ListView(
            padding: const EdgeInsets.only(bottom: 24),
            children: [
              // Sections enter as a wave: each block fades/slides in when
              // it scrolls into view (staggered by `index`).
              // Hero Search Bar
              const ScrollReveal(
                index: 0,
                child: Padding(
                  padding: EdgeInsets.fromLTRB(20, 16, 20, 8),
                  child: HeroSearchBar(),
                ),
              ),

              // Ad Carousel (if any)
              if (feed.adBanners.isNotEmpty) ...[
                const SizedBox(height: 16),
                ScrollReveal(
                  index: 1,
                  child: AdCarousel(banners: feed.adBanners),
                ),
              ],

              // Quick Services
              if (feed.offers != null ||
                  feed.onDutyPharmaciesCount != null ||
                  feed.onDutyPharmaciesCount! > 0) ...[
                const SizedBox(height: 20),
                ScrollReveal(
                  index: 2,
                  child: QuickServices(
                    offersCount: feed.offers?.length ?? 0,
                    pharmaciesCount: feed.onDutyPharmaciesCount ?? 0,
                  ),
                ),
              ],

              // Categories
              if (feed.categories.isNotEmpty)
                ScrollReveal(
                  index: 3,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 24),
                      SectionHeader(
                        title: 'التصنيفات',
                        onSeeAll: () => context.go(AppRoutes.categories),
                      ),
                      const SizedBox(height: 12),
                      CategoryGrid(categories: feed.categories),
                    ],
                  ),
                ),

              // Featured Businesses
              if (feed.featured.isNotEmpty)
                ScrollReveal(
                  index: 4,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 24),
                      BusinessSection(
                        title: '✨ مميّز',
                        businesses: feed.featured,
                        onSeeAll: () {
                          // TODO: Navigate to featured
                        },
                      ),
                    ],
                  ),
                ),

              // Top Rated
              if (feed.topRated.isNotEmpty)
                ScrollReveal(
                  index: 5,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 24),
                      BusinessSection(
                        title: '⭐ الأعلى تقييماً',
                        businesses: feed.topRated,
                        onSeeAll: () {
                          // TODO: Navigate to top rated
                        },
                      ),
                    ],
                  ),
                ),

              // Newest
              if (feed.newest.isNotEmpty)
                ScrollReveal(
                  index: 6,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 24),
                      BusinessSection(
                        title: '🆕 الأحدث',
                        businesses: feed.newest,
                        onSeeAll: () {
                          // TODO: Navigate to newest
                        },
                      ),
                    ],
                  ),
                ),

              // Stats (optional)
              if (feed.stats != null) ...[
                const SizedBox(height: 32),
                ScrollReveal(
                  index: 7,
                  child: _StatsCard(stats: feed.stats!),
                ),
              ],
            ],
          ),
        ),
        loading: () => const HomeSkeleton(),
        error: (error, stack) => ErrorView(
          // Failure carries the API's own message — show it clean.
          message: error is Failure ? error.message : 'حدث خطأ غير متوقع',
          onRetry: () => ref.invalidate(homeFeedProvider),
        ),
          ),
      ),
    );
  }
}

class _StatsCard extends StatelessWidget {
  final HomeStats stats;

  const _StatsCard({required this.stats});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: AppColors.gradientSoft,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _StatItem(
            icon: Icons.store,
            label: 'نشاط',
            value: _formatNumber(stats.businessCount),
            theme: theme,
          ),
          _StatItem(
            icon: Icons.star,
            label: 'تقييم',
            value: _formatNumber(stats.reviewCount),
            theme: theme,
          ),
          _StatItem(
            icon: Icons.location_city,
            label: 'مدينة',
            value: _formatNumber(stats.cityCount),
            theme: theme,
          ),
        ],
      ),
    );
  }

  String _formatNumber(int number) {
    if (number >= 1000000) {
      return '${(number / 1000000).toStringAsFixed(1)}م';
    } else if (number >= 1000) {
      return '${(number / 1000).toStringAsFixed(1)}ألف';
    }
    return number.toString();
  }
}

class _StatItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final ThemeData theme;

  const _StatItem({
    required this.icon,
    required this.label,
    required this.value,
    required this.theme,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: AppColors.primary, size: 28),
        const SizedBox(height: 8),
        Text(
          value,
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w800,
            color: AppColors.primary,
          ),
        ),
        Text(
          label,
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.hintColor,
          ),
        ),
      ],
    );
  }
}
