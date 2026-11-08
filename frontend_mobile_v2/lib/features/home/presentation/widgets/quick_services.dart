import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/app_router.dart';
import '../../../../core/widgets/section_header.dart';
import '../../../../core/widgets/scroll_reveal.dart';
import '../../../services/providers/features_providers.dart';

class QuickServices extends ConsumerWidget {
  final int offersCount;
  final int pharmaciesCount;

  const QuickServices({
    super.key,
    required this.offersCount,
    required this.pharmaciesCount,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final features = ref.watch(featuresOrDefaultProvider);
    final theme = Theme.of(context);

    final services = <_QuickService>[
      if (features.offers && offersCount > 0)
        _QuickService(
          icon: Icons.local_offer_outlined,
          label: 'العروض',
          badge: offersCount.toString(),
          gradient: const LinearGradient(
            colors: [Color(0xFFFF6A3D), Color(0xFFFF8E53)],
          ),
          onTap: () => context.push(AppRoutes.offers),
        ),
      if (features.pharmacies && pharmaciesCount > 0)
        _QuickService(
          icon: Icons.local_pharmacy_outlined,
          label: 'صيدليات مناوبة',
          badge: pharmaciesCount.toString(),
          gradient: const LinearGradient(
            colors: [Color(0xFF12B76A), Color(0xFF22C55E)],
          ),
          onTap: () => context.push(AppRoutes.pharmacies),
        ),
      if (features.emergency)
        _QuickService(
          icon: Icons.emergency_outlined,
          label: 'الطوارئ',
          gradient: const LinearGradient(
            colors: [Color(0xFFF04438), Color(0xFFEF4444)],
          ),
          onTap: () => context.push(AppRoutes.emergency),
        ),
      if (features.serviceRequests)
        _QuickService(
          icon: Icons.handyman_outlined,
          label: 'اطلب خدمة',
          gradient: const LinearGradient(
            colors: [Color(0xFF5B3DF5), Color(0xFF8B5CF6)],
          ),
          onTap: () {
            // TODO: Navigate to service requests
          },
        ),
    ];

    if (services.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader(title: 'خدمات سريعة'),
        const SizedBox(height: 12),
        SizedBox(
          height: 100,
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            scrollDirection: Axis.horizontal,
            itemCount: services.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              final service = services[index];
              return ScrollReveal(
                index: index,
                slide: const Offset(0.07, 0), // horizontal entrance
                child: _QuickServiceCard(service: service, theme: theme),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _QuickService {
  final IconData icon;
  final String label;
  final String? badge;
  final Gradient gradient;
  final VoidCallback onTap;

  _QuickService({
    required this.icon,
    required this.label,
    this.badge,
    required this.gradient,
    required this.onTap,
  });
}

class _QuickServiceCard extends StatelessWidget {
  final _QuickService service;
  final ThemeData theme;

  const _QuickServiceCard({
    required this.service,
    required this.theme,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: service.onTap,
      child: Container(
        width: 140,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: service.gradient,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.1),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Icon(
                  service.icon,
                  color: Colors.white,
                  size: 28,
                ),
                if (service.badge != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      service.badge!,
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
              ],
            ),
            Text(
              service.label,
              style: theme.textTheme.labelLarge?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w700,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
