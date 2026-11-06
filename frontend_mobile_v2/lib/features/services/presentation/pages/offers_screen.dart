import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/error/failures.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/skeletons.dart';
import '../../../../core/widgets/status_views.dart';
import '../../domain/entities/services_entities.dart';
import '../../providers/services_providers.dart';

/// Active offers & discounts — `GET /offers` (public, handoff rule: guest OK).
class OffersScreen extends ConsumerWidget {
  const OffersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(offersProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('العروض والخصومات')),
      body: async.when(
        data: (offers) {
          if (offers.isEmpty) {
            return const EmptyView(
              message: 'لا توجد عروض متاحة حالياً',
              icon: Icons.local_offer_outlined,
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(offersProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(20),
              itemCount: offers.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, i) => _OfferCard(offer: offers[i]),
            ),
          );
        },
        loading: () => const ListSkeleton(itemCount: 5, itemHeight: 110),
        error: (e, _) => ErrorView(
          message: e is Failure ? e.message : 'تعذّر تحميل العروض',
          onRetry: () => ref.invalidate(offersProvider),
        ),
      ),
    );
  }
}

class _OfferCard extends StatelessWidget {
  const _OfferCard({required this.offer});

  final Offer offer;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final expired = offer.isExpired;

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: offer.businessId == null
            ? null
            : () => context.push('/businesses/${offer.businessId}'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Discount ribbon
              Container(
                width: 64,
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  gradient: AppColors.warmGradient,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(
                  children: [
                    Text(
                      offer.discountPercent != null
                          ? '${offer.discountPercent}%'
                          : 'عرض',
                      style: theme.textTheme.titleMedium?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    Text('خصم',
                        style: theme.textTheme.labelSmall
                            ?.copyWith(color: Colors.white)),
                  ],
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(offer.title,
                        style: theme.textTheme.titleSmall
                            ?.copyWith(fontWeight: FontWeight.w700)),
                    if (offer.description != null) ...[
                      const SizedBox(height: 4),
                      Text(offer.description!,
                          style: theme.textTheme.bodySmall
                              ?.copyWith(color: theme.hintColor)),
                    ],
                    if (offer.couponCode != null) ...[
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          border: Border.all(
                              color: AppColors.primary.withValues(alpha: 0.4)),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.confirmation_num_outlined,
                                size: 14, color: AppColors.primary),
                            const SizedBox(width: 6),
                            Text(offer.couponCode!,
                                style: const TextStyle(
                                    color: AppColors.primary,
                                    fontWeight: FontWeight.w700,
                                    fontSize: 13)),
                          ],
                        ),
                      ),
                    ],
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        if (expired)
                          Text('منتهي',
                              style: theme.textTheme.labelSmall
                                  ?.copyWith(color: AppColors.error))
                        else if (offer.endDate != null)
                          Text('حتى ${_date(offer.endDate!)}',
                              style: theme.textTheme.labelSmall
                                  ?.copyWith(color: AppColors.success)),
                        const Spacer(),
                        if (offer.businessName != null)
                          Flexible(
                            child: Text(offer.businessName!,
                                style: theme.textTheme.labelSmall
                                    ?.copyWith(color: theme.hintColor),
                                overflow: TextOverflow.ellipsis),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  static String _date(DateTime d) =>
      '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}';
}