import 'package:flutter/material.dart';

import '../theme/app_motion.dart';

/// The app's standard tappable card.
///
/// Every new card in the app should be built on this instead of on a bare
/// `GestureDetector`/`Container`, so it *inherits* the motion language by
/// construction: rounded Material surface, Material ripple, and the shared
/// press-scale from [Pressable]. See CONVENTIONS_AR.md §11.
///
/// ```dart
/// AppCard(
///   onTap: () => context.push('/x'),
///   child: MyCardContent(),
/// )
/// ```
class AppCard extends StatelessWidget {
  const AppCard({
    super.key,
    required this.child,
    this.onTap,
    this.radius = 14,
    this.clipBehavior = Clip.antiAlias,
    this.elevation,
    this.margin,
    this.pressScale = AppMotion.pressScale,
  });

  final Widget child;
  final VoidCallback? onTap;

  /// Corner radius; also clips the ripple to the visible shape.
  final double radius;

  /// `antiAlias` keeps the image corners clean — required whenever the
  /// child paints beyond the card bounds (cover images, gradients).
  final Clip clipBehavior;

  final double? elevation;

  /// Overrides the theme's card margin when the card must be flush.
  final EdgeInsetsGeometry? margin;

  /// Press feedback; set to 0 to opt out (rare — prefer keeping it).
  final double pressScale;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: clipBehavior,
      elevation: elevation,
      margin: margin,
      child: Pressable(
        onTap: onTap,
        scale: pressScale,
        borderRadius: BorderRadius.circular(radius),
        child: child,
      ),
    );
  }
}
