import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/error/failures.dart';
import '../../../../core/prefs/prefs_providers.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/skeletons.dart';
import '../../domain/entities/business.dart';
import '../../providers/business_providers.dart';

/// Full details for one business — `GET /businesses/{slug}`.
class BusinessDetailsScreen extends ConsumerWidget {
  const BusinessDetailsScreen({super.key, required this.slug});

  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(businessDetailsProvider(slug));
    final locale = ref.watch(localeProvider).languageCode;

    return Scaffold(
      body: async.when(
        data: (business) => _Details(business: business, locale: locale),
        loading: () => const DetailsSkeleton(),
        error: (error, stack) => Scaffold(
          appBar: AppBar(),
          body: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.error_outline,
                    size: 64, color: Theme.of(context).colorScheme.error),
                const SizedBox(height: 16),
                Text(
                  error is Failure ? error.message : 'تعذّر تحميل النشاط',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                FilledButton.icon(
                  onPressed: () => ref.invalidate(businessDetailsProvider(slug)),
                  icon: const Icon(Icons.refresh),
                  label: const Text('إعادة المحاولة'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Details extends ConsumerWidget {
  const _Details({required this.business, required this.locale});

  final Business business;
  final String locale;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final name = business.localizedName(locale);

    return CustomScrollView(
      slivers: [
        // ── Cover + app bar ──
        SliverAppBar(
          expandedHeight: 240,
          pinned: true,
          leading: IconButton(
            // Cold-start deep link has no history to pop → go home instead.
            onPressed: () =>
                context.canPop() ? context.pop() : context.go('/home'),
            icon: const Icon(Icons.arrow_forward_rounded), // RTL back
            tooltip: 'رجوع',
          ),
          flexibleSpace: FlexibleSpaceBar(
            background: Stack(
              fit: StackFit.expand,
              children: [
                if (business.coverImage != null &&
                    business.coverImage!.isNotEmpty)
                  CachedNetworkImage(
                    imageUrl: business.coverImage!,
                    fit: BoxFit.cover,
                    errorWidget: (_, __, ___) =>
                        const _CoverFallback(gradient: AppColors.gradient),
                  )
                else
                  const _CoverFallback(gradient: AppColors.gradient),
                // legibility gradient over the image
                const DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Colors.transparent, Color(0x66000000)],
                    ),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            IconButton(
              onPressed: () => _share(context, name),
              icon: const Icon(Icons.share_outlined),
              tooltip: 'مشاركة',
            ),
          ],
        ),

        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── Name + badges ──
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(name, style: theme.textTheme.headlineSmall),
                    ),
                    const SizedBox(width: 12),
                    if (business.isVerified)
                      const _Badge(
                        icon: Icons.verified_rounded,
                        label: 'موثّق',
                        color: AppColors.primary,
                      ),
                  ],
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    if (business.isOpenNow != null)
                      _Badge(
                        icon: business.isOpenNow!
                            ? Icons.schedule_rounded
                            : Icons.schedule_outlined,
                        label: business.isOpenNow! ? 'مفتوح الآن' : 'مغلق',
                        color: business.isOpenNow!
                            ? AppColors.success
                            : AppColors.lightTextSecondary,
                      ),
                    _Badge(
                      icon: Icons.category_outlined,
                      label: business.subCategory?.name ??
                          business.category.name,
                      color: AppColors.info,
                    ),
                    if (business.isFeatured)
                      const _Badge(
                        icon: Icons.workspace_premium_outlined,
                        label: 'مميّز',
                        color: AppColors.warning,
                      ),
                    if (business.priceLevel != null)
                      _Badge(
                        icon: Icons.payments_outlined,
                        label: business.priceLevel!.symbol,
                        color: AppColors.secondary,
                      ),
                  ],
                ),

                // ── Rating ──
                if (business.reviewCount > 0) ...[
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      const Icon(Icons.star_rounded,
                          color: AppColors.warning, size: 22),
                      const SizedBox(width: 6),
                      Text(
                        business.averageRating.toStringAsFixed(1),
                        style: theme.textTheme.titleMedium,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        '(${business.reviewCount} تقييم)',
                        style: theme.textTheme.bodyMedium
                            ?.copyWith(color: theme.hintColor),
                      ),
                    ],
                  ),
                ],

                const SizedBox(height: 20),

                // ── Contact actions ──
                _ActionRow(business: business, name: name),

                // ── Address ──
                if (business.address != null ||
                    business.district != null ||
                    business.city.name.isNotEmpty) ...[
                  const SizedBox(height: 24),
                  _SectionTitle(title: 'العنوان', theme: theme),
                  const SizedBox(height: 8),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.location_on_outlined,
                          size: 20, color: AppColors.primary),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          [
                            business.address,
                            business.district,
                            business.city.name,
                          ].where((e) => e != null && e.isNotEmpty).join('، '),
                          style: theme.textTheme.bodyMedium,
                        ),
                      ),
                    ],
                  ),
                ],

                // ── Description ──
                if (business.description != null &&
                    business.description!.isNotEmpty) ...[
                  const SizedBox(height: 24),
                  _SectionTitle(title: 'نبذة', theme: theme),
                  const SizedBox(height: 8),
                  Text(business.description!,
                      style: theme.textTheme.bodyMedium?.copyWith(height: 1.7)),
                ],

                // ── Amenities ──
                if (business.amenities.isNotEmpty) ...[
                  const SizedBox(height: 24),
                  _SectionTitle(title: 'المرافق', theme: theme),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final a in business.amenities)
                        Chip(
                          label: Text(a),
                          visualDensity: VisualDensity.compact,
                        ),
                    ],
                  ),
                ],

                const SizedBox(height: 32),
                Center(
                  child: Text(
                    'بيانات الخرائط والأماكن © مساهمو OpenStreetMap',
                    style: theme.textTheme.bodySmall
                        ?.copyWith(color: theme.hintColor),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  void _share(BuildContext context, String name) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('مشاركة: $name — قريباً')),
    );
  }
}

/// Call / WhatsApp / directions / website actions.
/// TODO(phase-d): POST /businesses/{id}/track {type} BEFORE each action.
class _ActionRow extends StatelessWidget {
  const _ActionRow({required this.business, required this.name});

  final Business business;
  final String name;

  @override
  Widget build(BuildContext context) {
    final actions = <(IconData, String, VoidCallback)>[
      if (business.phone != null && business.phone!.isNotEmpty)
        (
          Icons.call_outlined,
          'اتصال',
          () => ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('الاتصال: ${business.phone}')),
          ),
        ),
      if (business.whatsapp != null && business.whatsapp!.isNotEmpty)
        (
          Icons.chat_outlined,
          'واتساب',
          () => ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('واتساب: ${business.whatsapp}')),
          ),
        ),
      if (business.latitude != null && business.longitude != null)
        (
          Icons.directions_outlined,
          'اتجاهات',
          () => ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('فتح الخرائط — قريباً')),
          ),
        ),
      if (business.website != null && business.website!.isNotEmpty)
        (
          Icons.language_outlined,
          'الموقع',
          () => ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(business.website!)),
          ),
        ),
    ];

    if (actions.isEmpty) return const SizedBox.shrink();

    return Row(
      children: [
        for (final (icon, label, onTap) in actions) ...[
          Expanded(
            child: _ActionButton(icon: icon, label: label, onTap: onTap),
          ),
          if (icon != actions.last.$1) const SizedBox(width: 10),
        ],
      ],
    );
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton(
      {required this.icon, required this.label, required this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Material(
      color: AppColors.primary.withValues(alpha: 0.08),
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Column(
            children: [
              Icon(icon, color: AppColors.primary, size: 22),
              const SizedBox(height: 6),
              Text(label,
                  style: theme.textTheme.labelSmall
                      ?.copyWith(fontWeight: FontWeight.w600)),
            ],
          ),
        ),
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge(
      {required this.icon, required this.label, required this.color});

  final IconData icon;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 5),
          Text(label,
              style: TextStyle(
                  color: color, fontSize: 12, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title, required this.theme});

  final String title;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) =>
      Text(title, style: theme.textTheme.titleMedium);
}

class _CoverFallback extends StatelessWidget {
  const _CoverFallback({required this.gradient});

  final Gradient gradient;

  @override
  Widget build(BuildContext context) => Container(
        decoration: BoxDecoration(gradient: gradient),
        child: const Center(
          child: Icon(Icons.storefront_rounded,
              color: Colors.white, size: 64),
        ),
      );
}