import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/error/failures.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/skeletons.dart';
import '../../../../core/widgets/status_views.dart';
import '../../domain/entities/services_entities.dart';
import '../../providers/services_providers.dart';

/// On-duty pharmacies today — `GET /pharmacies/on-duty` (public).
class PharmaciesScreen extends ConsumerWidget {
  const PharmaciesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(onDutyPharmaciesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('صيدليات مناوبة')),
      body: async.when(
        data: (items) {
          if (items.isEmpty) {
            return const EmptyView(
              message: 'لا توجد صيدليات مناوبة مسجّلة اليوم',
              icon: Icons.local_pharmacy_outlined,
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(onDutyPharmaciesProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(20),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, i) => _DutyTile(pharmacy: items[i]),
            ),
          );
        },
        loading: () => const ListSkeleton(itemCount: 4, itemHeight: 84),
        error: (e, _) => ErrorView(
          message: e is Failure ? e.message : 'تعذّر تحميل الصيدليات',
          onRetry: () => ref.invalidate(onDutyPharmaciesProvider),
        ),
      ),
    );
  }
}

class _DutyTile extends StatelessWidget {
  const _DutyTile({required this.pharmacy});

  final DutyPharmacy pharmacy;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: pharmacy.businessId == null
            ? null
            : () => context.push('/businesses/${pharmacy.businessId}'),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: AppColors.success.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(Icons.local_pharmacy_rounded,
                    color: AppColors.success),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(pharmacy.name,
                        style: theme.textTheme.titleSmall
                            ?.copyWith(fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    Text(
                      [
                        if (pharmacy.from != null && pharmacy.to != null)
                          'من ${pharmacy.from} إلى ${pharmacy.to}',
                        pharmacy.address ?? pharmacy.cityName ?? '',
                      ].where((e) => e.isNotEmpty).join(' · '),
                      style: theme.textTheme.bodySmall
                          ?.copyWith(color: theme.hintColor),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              if (pharmacy.phone != null && pharmacy.phone!.isNotEmpty)
                IconButton.filledTonal(
                  onPressed: () =>
                      launchUrl(Uri.parse('tel:${pharmacy.phone}')),
                  icon: const Icon(Icons.call_rounded, size: 20),
                  tooltip: 'اتصال',
                ),
            ],
          ),
        ),
      ),
    );
  }
}