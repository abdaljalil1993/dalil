import 'package:cached_network_image/cached_network_image.dart';
import 'package:carousel_slider/carousel_slider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';

import '../../../../core/theme/app_motion.dart';
import '../../../../core/theme/app_theme.dart';
import '../../domain/entities/home_feed.dart';
import '../../providers/ad_providers.dart';

class AdCarousel extends ConsumerStatefulWidget {
  final List<AdBanner> banners;

  const AdCarousel({super.key, required this.banners});

  @override
  ConsumerState<AdCarousel> createState() => _AdCarouselState();
}

class _AdCarouselState extends ConsumerState<AdCarousel> {
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    // Rule #3: the first visible banner counts as an impression.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) ref.read(adTrackingProvider).impression(widget.banners[0]);
    });
  }

  void _onPageChanged(int index, _) {
    setState(() => _currentIndex = index);
    // Rule #3: every banner that becomes visible counts once.
    ref.read(adTrackingProvider).impression(widget.banners[index]);
  }

  Future<void> _onTap(AdBanner banner) async {
    final tracking = ref.read(adTrackingProvider);
    await tracking.click(banner); // analytics first
    if (!mounted) return;
    final handled = tracking.openInApp(
      Uri.parse(banner.targetUrl ?? '/'),
      banner,
      (location) => context.go(location),
    );
    if (!handled) {
      final target = banner.targetUrl;
      if (target != null && target.startsWith('http')) {
        await tracking.openExternal(target);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.banners.isEmpty) return const SizedBox.shrink();

    return Column(
      children: [
        CarouselSlider.builder(
          itemCount: widget.banners.length,
          itemBuilder: (context, index, realIndex) {
            final banner = widget.banners[index];
            return _AdBannerCard(
              banner: banner,
              onTap: () => _onTap(banner),
            );
          },
          options: CarouselOptions(
            height: 180,
            viewportFraction: 0.9,
            autoPlay: widget.banners.length > 1,
            autoPlayInterval: const Duration(seconds: 5),
            enlargeCenterPage: true,
            onPageChanged: _onPageChanged,
          ),
        ),
        if (widget.banners.length > 1) ...[
          const SizedBox(height: 12),
          AnimatedSmoothIndicator(
            activeIndex: _currentIndex,
            count: widget.banners.length,
            effect: WormEffect(
              dotWidth: 8,
              dotHeight: 8,
              activeDotColor: AppColors.primary,
              dotColor: AppColors.primary.withValues(alpha: 0.2),
            ),
          ),
        ],
      ],
    );
  }
}

class _AdBannerCard extends StatelessWidget {
  final AdBanner banner;
  final VoidCallback onTap;

  const _AdBannerCard({required this.banner, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Pressable(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      // The banner is an opaque image: a ripple would hide behind it, so
      // feedback is the press scale alone.
      ripple: false,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 4),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.1),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: Stack(
            fit: StackFit.expand,
            children: [
              // Background Image
              if (banner.imageUrl != null)
                CachedNetworkImage(
                  imageUrl: banner.imageUrl!,
                  fit: BoxFit.cover,
                  placeholder: (context, url) => Container(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    child: const Center(child: CircularProgressIndicator()),
                  ),
                  errorWidget: (context, url, error) => Container(
                    decoration: BoxDecoration(
                      gradient: AppColors.gradient,
                    ),
                  ),
                )
              else
                Container(
                  decoration: BoxDecoration(
                    gradient: AppColors.gradient,
                  ),
                ),

              // Gradient Overlay
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.transparent,
                      Colors.black.withValues(alpha: 0.7),
                    ],
                  ),
                ),
              ),

              // Title
              Positioned(
                bottom: 16,
                left: 16,
                right: 16,
                child: Text(
                  banner.title,
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),

              // Ad Badge
              Positioned(
                top: 12,
                right: 12,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.9),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    'إعلان',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
