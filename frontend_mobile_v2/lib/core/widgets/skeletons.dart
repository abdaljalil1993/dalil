import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

import 'status_views.dart';

/// Loading skeletons — the page shape itself, shimmering, instead of a
/// bare spinner. Match each screen's real layout.
class _SkeletonTheme extends StatelessWidget {
  const _SkeletonTheme({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Shimmer.fromColors(
      baseColor: isDark ? Colors.white12 : Colors.black.withValues(alpha: 0.06),
      highlightColor:
          isDark ? Colors.white24 : Colors.black.withValues(alpha: 0.12),
      child: child,
    );
  }
}

/// Home feed skeleton: hero + services row + category grid + cards.
class HomeSkeleton extends StatelessWidget {
  const HomeSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return _SkeletonTheme(
      child: ListView(
        padding: const EdgeInsets.all(20),
        physics: const NeverScrollableScrollPhysics(),
        children: [
          const SkeletonBox(height: 96, radius: 16),
          const SizedBox(height: 20),
          const SkeletonBox(height: 14, width: 120, radius: 7),
          const SizedBox(height: 12),
          const Row(
            children: [
              Expanded(child: SkeletonBox(height: 96, radius: 16)),
              SizedBox(width: 10),
              Expanded(child: SkeletonBox(height: 96, radius: 16)),
              SizedBox(width: 10),
              Expanded(child: SkeletonBox(height: 96, radius: 16)),
            ],
          ),
          const SizedBox(height: 24),
          const SkeletonBox(height: 14, width: 100, radius: 7),
          const SizedBox(height: 12),
          GridView.count(
            crossAxisCount: 4,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 16,
            crossAxisSpacing: 16,
            childAspectRatio: 0.85,
            children: List.generate(
              8,
              (_) => const Column(
                children: [
                  SkeletonBox(width: 60, height: 60, radius: 16),
                  SizedBox(height: 8),
                  SkeletonBox(height: 10, radius: 5),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          const SkeletonBox(height: 14, width: 140, radius: 7),
          const SizedBox(height: 12),
          const Row(
            children: [
              Expanded(child: SkeletonBox(height: 220, radius: 16)),
              SizedBox(width: 12),
              Expanded(child: SkeletonBox(height: 220, radius: 16)),
            ],
          ),
        ],
      ),
    );
  }
}

/// Vertical list skeleton (categories / search results).
class ListSkeleton extends StatelessWidget {
  const ListSkeleton({super.key, this.itemCount = 8, this.itemHeight = 72});

  final int itemCount;
  final double itemHeight;

  @override
  Widget build(BuildContext context) {
    return _SkeletonTheme(
      child: ListView.separated(
        padding: const EdgeInsets.all(20),
        physics: const NeverScrollableScrollPhysics(),
        itemCount: itemCount,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (_, __) => SkeletonBox(height: itemHeight, radius: 16),
      ),
    );
  }
}

/// Cover + text blocks — for details pages.
class DetailsSkeleton extends StatelessWidget {
  const DetailsSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return _SkeletonTheme(
      child: ListView(
        physics: const NeverScrollableScrollPhysics(),
        children: [
          const SkeletonBox(height: 240, radius: 0),
          const Padding(
            padding: EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SkeletonBox(height: 26, width: 220, radius: 8),
                SizedBox(height: 12),
                Row(
                  children: [
                    SkeletonBox(height: 26, width: 80, radius: 13),
                    SizedBox(width: 8),
                    SkeletonBox(height: 26, width: 100, radius: 13),
                  ],
                ),
                SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(child: SkeletonBox(height: 76, radius: 14)),
                    SizedBox(width: 10),
                    Expanded(child: SkeletonBox(height: 76, radius: 14)),
                    SizedBox(width: 10),
                    Expanded(child: SkeletonBox(height: 76, radius: 14)),
                  ],
                ),
                SizedBox(height: 24),
                SkeletonBox(height: 16, width: 90, radius: 8),
                SizedBox(height: 10),
                SkeletonBox(height: 14),
                SizedBox(height: 6),
                SkeletonBox(height: 14, width: 260),
                SizedBox(height: 24),
                SkeletonBox(height: 16, width: 60, radius: 8),
                SizedBox(height: 10),
                SkeletonBox(height: 14),
                SizedBox(height: 6),
                SkeletonBox(height: 14, width: 300),
              ],
            ),
          ),
        ],
      ),
    );
  }
}