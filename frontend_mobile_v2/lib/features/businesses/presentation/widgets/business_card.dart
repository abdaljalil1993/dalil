import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/prefs/prefs_providers.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/utils/category_icons.dart';
import '../../domain/entities/business.dart';

class BusinessCard extends ConsumerWidget {
  final Business business;
  final VoidCallback? onTap;

  const BusinessCard({
    super.key,
    required this.business,
    this.onTap,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final locale = ref.watch(localeProvider).languageCode;

    return AppCard(
      onTap: onTap ?? () => context.push('/businesses/${business.slug}'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Cover Image
          Stack(
            children: [
              _buildCover(),
              
              // Featured Badge
              if (business.isFeatured)
                Positioned(
                  top: 8,
                  right: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      gradient: AppColors.gradient,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.star, color: Colors.white, size: 14),
                        const SizedBox(width: 4),
                        Text(
                          'مميّز',
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

              // Logo (if available)
              if (business.logoImage != null)
                Positioned(
                  bottom: 8,
                  left: 8,
                  child: Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.1),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: CachedNetworkImage(
                        imageUrl: business.logoImage!,
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                ),
            ],
          ),

          // Info — no Expanded/Spacer: must survive unbounded-height
          // parents (SliverList sizes children to content).
          Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          business.localizedName(locale),
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (business.isVerified)
                        const Icon(
                          Icons.verified,
                          color: AppColors.info,
                          size: 16,
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  
                  // Category
                  Text(
                    business.category.localizedName(locale),
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.hintColor,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  
                  const SizedBox(height: 12),
                  
                  // Rating & Location
                  Row(
                    children: [
                      // Rating
                      if (business.reviewCount > 0) ...[
                        const Icon(Icons.star, color: AppColors.warning, size: 16),
                        const SizedBox(width: 4),
                        Text(
                          business.averageRating.toStringAsFixed(1),
                          style: theme.textTheme.labelMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          ' (${business.reviewCount})',
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: theme.hintColor,
                          ),
                        ),
                      ],
                      
                      const SizedBox(height: 12),
                      
                      // Open Now or City
                      if (business.isOpenNow != null)
                        _buildOpenNowIndicator(business.isOpenNow!, theme)
                      else
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.location_on_outlined,
                              size: 14,
                              color: theme.hintColor,
                            ),
                            const SizedBox(width: 2),
                            Text(
                              business.city.localizedName(locale),
                              style: theme.textTheme.labelSmall?.copyWith(
                                color: theme.hintColor,
                              ),
                            ),
                          ],
                        ),
                    ],
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildCover() {
    if (business.coverImage != null) {
      return CachedNetworkImage(
        imageUrl: business.coverImage!,
        height: 120,
        width: double.infinity,
        fit: BoxFit.cover,
        placeholder: (context, url) => Container(
          height: 120,
          color: AppColors.primary.withValues(alpha: 0.1),
        ),
        errorWidget: (context, url, error) => _buildFallbackCover(),
      );
    }
    
    return _buildFallbackCover();
  }

  Widget _buildFallbackCover() {
    // Use category color gradient as fallback
    final categoryColor = parseHexColor(business.category.color) ?? AppColors.primary;
    
    return Container(
      height: 120,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            categoryColor,
            categoryColor.withValues(alpha: 0.7),
          ],
        ),
      ),
      child: Center(
        child: Icon(
          categoryIcon(business.category.icon),
          color: Colors.white.withValues(alpha: 0.6),
          size: 48,
        ),
      ),
    );
  }


  Widget _buildOpenNowIndicator(bool isOpen, ThemeData theme) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: isOpen
            ? AppColors.success.withValues(alpha: 0.1)
            : AppColors.error.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: isOpen ? AppColors.success : AppColors.error,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 4),
          Text(
            isOpen ? 'مفتوح' : 'مغلق',
            style: theme.textTheme.labelSmall?.copyWith(
              color: isOpen ? AppColors.success : AppColors.error,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
