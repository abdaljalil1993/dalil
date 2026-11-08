import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../theme/app_motion.dart';

/// Uniform page transitions for the whole route table.
///
/// Material's default is a hard slide-up; these read calmer and — more
/// importantly — read *the same* on every platform (Android, iOS, Chrome),
/// so navigation feels designed rather than inherited.
abstract final class AppPages {
  /// A pushed screen: fades in while settling from slightly smaller than
  /// its final size. Used for detail pages and the auth stack.
  static CustomTransitionPage<T> push<T>(GoRouterState state, Widget child) =>
      CustomTransitionPage<T>(
        key: state.pageKey,
        child: child,
        transitionDuration: AppMotion.slow,
        reverseTransitionDuration: AppMotion.base,
        transitionsBuilder: _fadeAndSettle,
      );

  /// A tab/branch screen: a short cross-fade, no zoom — tab switching must
  /// feel instant, not like a journey.
  static CustomTransitionPage<T> tab<T>(GoRouterState state, Widget child) =>
      CustomTransitionPage<T>(
        key: state.pageKey,
        child: child,
        transitionDuration: AppMotion.base,
        reverseTransitionDuration: AppMotion.fast,
        transitionsBuilder: (context, animation, secondary, child) =>
            FadeTransition(
          opacity: CurvedAnimation(
            parent: animation,
            curve: AppMotion.easeOut,
            reverseCurve: AppMotion.easeIn,
          ),
          child: child,
        ),
      );

  static Widget _fadeAndSettle(
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    final curved = CurvedAnimation(
      parent: animation,
      curve: AppMotion.easeOut,
      reverseCurve: AppMotion.easeIn,
    );
    return FadeTransition(
      opacity: curved,
      child: ScaleTransition(
        scale: Tween<double>(begin: 0.98, end: 1.0).animate(curved),
        child: child,
      ),
    );
  }
}
