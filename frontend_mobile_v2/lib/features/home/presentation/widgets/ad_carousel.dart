import 'package:cached_network_image/cached_network_image.dart';
import 'package:carousel_slider/carousel_slider.dart';
import 'package:flutter/material.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';

import '../../../../core/theme/app_theme.dart';
import '../../domain/entities/home_feed.dart';

class AdCarousel extends StatefulWidget {
  final List<AdBanner> banners;

  const AdCarousel({super.key, required this.banners});

  @override
  State<AdCarousel> createState() => _AdCarouselState();
}

class _AdCarouselState extends State<AdCarousel> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    if (widget.banners.isEmpty) return const SizedBox.shrink();

    return Column(
      children: [
        CarouselSlider.builder(
          itemCount: widget.banners.length,
          itemBuilder: (context, index, realIndex) {
            final banner = widget.banners[index];
            return _AdBannerCard(banner: banner);
          },
          options: CarouselOptions(
            height: 180,
            viewportFraction: 0.9,
            autoPlay: widget.banners.length > 1,
            autoPlayInterval: const Duration(seconds: 5),
            enlargeCenterPage: true,
            onPageChanged: (index, reason) {
              setState(() => _currentIndex = index);
            },
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

  const _AdBannerCard({required this.banner});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return GestureDetector(
      onTap: () {
        // TODO: Track impression and handle click
        if (banner.targetUrl != null) {
          _handleAdClick(context, banner);
        }
      },
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

  void _handleAdClick(BuildContext context, AdBanner banner) {
    // TODO: Implement ad tracking and deep link handling
    // POST /advertisements/{id}/click
    // If targetUrl starts with /b/ or /c/ -> navigate in-app
    // Otherwise -> url_launcher
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Ad clicked: ${banner.title}')),
    );
  }
}
