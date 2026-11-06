import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/error/failures.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/skeletons.dart';
import '../../../../core/widgets/status_views.dart';
import '../../domain/entities/services_entities.dart';
import '../../providers/services_providers.dart';

/// Emergency & public service numbers — `GET /emergency` (public).
class EmergencyScreen extends ConsumerWidget {
  const EmergencyScreen({super.key});

  static const _typeIcons = <String, IconData>{
    'ambulance': Icons.emergency_rounded,
    'police': Icons.local_police_rounded,
    'fire': Icons.fire_truck_rounded,
    'electricity': Icons.electric_bolt_rounded,
    'water': Icons.water_drop_rounded,
    'gas': Icons.local_gas_station_rounded,
  };

  static const _typeColors = <String, Color>{
    'ambulance': AppColors.error,
    'police': AppColors.info,
    'fire': AppColors.secondary,
    'electricity': AppColors.warning,
    'water': AppColors.info,
    'gas': AppColors.warning,
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(emergencyProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('الأرقام الطارئة')),
      body: async.when(
        data: (numbers) {
          if (numbers.isEmpty) {
            return const EmptyView(
              message: 'لا توجد أرقام متاحة',
              icon: Icons.emergency_outlined,
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(emergencyProvider),
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.error.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.info_outline_rounded,
                          color: AppColors.error, size: 20),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'اتصل بالر المناسب — الخطوط الطارئة مجانية.',
                          style: theme.textTheme.bodySmall,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                for (final n in numbers) ...[
                  _NumberCard(number: n),
                  const SizedBox(height: 10),
                ],
              ],
            ),
          );
        },
        loading: () => const ListSkeleton(itemCount: 6, itemHeight: 72),
        error: (e, _) => ErrorView(
          message: e is Failure ? e.message : 'تعذّر تحميل الأرقام',
          onRetry: () => ref.invalidate(emergencyProvider),
        ),
      ),
    );
  }
}

class _NumberCard extends StatelessWidget {
  const _NumberCard({required this.number});

  final EmergencyNumber number;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final icon = EmergencyScreen._typeIcons[number.type] ?? Icons.phone_rounded;
    final color =
        EmergencyScreen._typeColors[number.type] ?? AppColors.primary;

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => launchUrl(Uri.parse('tel:${number.phone}')),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(13),
                ),
                child: Icon(icon, color: color),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(number.name,
                        style: theme.textTheme.titleSmall
                            ?.copyWith(fontWeight: FontWeight.w700)),
                    if (number.note != null && number.note!.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(number.note!,
                          style: theme.textTheme.bodySmall
                              ?.copyWith(color: theme.hintColor)),
                    ],
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(number.phone,
                      style: theme.textTheme.titleMedium
                          ?.copyWith(color: color, fontWeight: FontWeight.w800)),
                  if (number.phone2 != null && number.phone2!.isNotEmpty)
                    Text(number.phone2!,
                        style: theme.textTheme.labelSmall
                            ?.copyWith(color: theme.hintColor)),
                ],
              ),
              const SizedBox(width: 8),
              Icon(Icons.phone_rounded, color: color, size: 20),
            ],
          ),
        ),
      ),
    );
  }
}