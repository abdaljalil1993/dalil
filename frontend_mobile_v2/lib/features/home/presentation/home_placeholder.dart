import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_theme.dart';
import '../../services/providers/features_providers.dart';

/// Temporary shell while features are built out (Stage 1).
/// Replaced by the real Home feed in Stage 3.
class HomePlaceholder extends ConsumerWidget {
  const HomePlaceholder({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final features = ref.watch(featuresOrDefaultProvider);
    final theme = Theme.of(context);

    final tiles = <(String, IconData, bool)>[
      ('العروض', Icons.local_offer_outlined, features.offers),
      ('صيدليات مناوبة', Icons.local_pharmacy_outlined, features.pharmacies),
      ('الطوارئ', Icons.emergency_outlined, features.emergency),
      ('اطلب خدمة', Icons.handyman_outlined, features.serviceRequests),
      ('عقارات', Icons.home_work_outlined, features.realEstate),
      ('سيارات', Icons.directions_car_outlined, features.cars),
      ('وظائف', Icons.work_outline, features.jobs),
      ('البحث', Icons.search, features.search),
      ('المفضلة', Icons.favorite_outline, features.favorites),
      ('التقييمات', Icons.star_outline, features.reviews),
    ].where((t) => t.$3).toList();

    return Scaffold(
      appBar: AppBar(
        title: Text('دليلك', style: theme.textTheme.titleLarge),
        actions: [
          IconButton(
            onPressed: () {},
            icon: const Icon(Icons.notifications_none_rounded),
            tooltip: 'الإشعارات',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(featuresProvider),
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: AppColors.gradient,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'ابحث عن أي شيء في مدينتك',
                    style: theme.textTheme.titleLarge?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'أطباء، مطاعم، فنادق، محامون، حرفيون... بمواعيد الدوام وأرقام التواصل.',
                    style: theme.textTheme.bodyMedium
                        ?.copyWith(color: Colors.white.withValues(alpha: 0.9)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Text('خدمات سريعة', style: theme.textTheme.titleMedium),
            const SizedBox(height: 12),
            GridView.count(
              crossAxisCount: 3,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 0.95,
              children: [
                for (final (label, icon, _) in tiles)
                  Container(
                    decoration: BoxDecoration(
                      color: theme.colorScheme.surface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.borderLight),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 46,
                          height: 46,
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Icon(icon, color: AppColors.primary),
                        ),
                        const SizedBox(height: 10),
                        Text(label,
                            style: theme.textTheme.labelLarge,
                            textAlign: TextAlign.center),
                      ],
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 24),
            Text(
              'المرحلة 1 — الأساس جاهز، الشاشات الحقيقية قادمة',
              style: theme.textTheme.bodySmall?.copyWith(color: theme.hintColor),
            ),
          ],
        ),
      ),
    );
  }
}
