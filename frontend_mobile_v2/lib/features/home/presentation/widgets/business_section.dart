import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../businesses/domain/entities/business.dart';
import '../../../businesses/presentation/widgets/business_card.dart';

class BusinessSection extends ConsumerWidget {
  final String title;
  final List<Business> businesses;
  final VoidCallback? onSeeAll;

  const BusinessSection({
    super.key,
    required this.title,
    required this.businesses,
    this.onSeeAll,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);

    if (businesses.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: theme.textTheme.titleMedium),
              if (onSeeAll != null)
                TextButton(
                  onPressed: onSeeAll,
                  child: const Text('عرض الكل'),
                ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 240,
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            scrollDirection: Axis.horizontal,
            itemCount: businesses.take(10).length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              final business = businesses[index];
              return SizedBox(
                width: 280,
                child: BusinessCard(
                  business: business,
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
