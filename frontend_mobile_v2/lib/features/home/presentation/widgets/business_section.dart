import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/widgets/section_header.dart';
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
    if (businesses.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(title: title, onSeeAll: onSeeAll),
        const SizedBox(height: 12),
        SizedBox(
          height: 224,
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
