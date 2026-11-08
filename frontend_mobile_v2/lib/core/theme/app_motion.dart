import 'package:flutter/material.dart';

/// The app's motion language: one place where durations, curves and press
/// feedback live.
///
/// Rule of thumb (Material 3 baseline, tuned for this app):
///   [AppMotion.fast]  → finger feedback (press, ripple, hover)
///   [AppMotion.base]  → a state change (tabs, sheets, images)
///   [AppMotion.slow]  → an element entering the stage (reveals, pushes)
///
/// Never hardcode a duration inside a widget — use a token, so the whole
/// app can be retimed from here instead of from forty call sites.
abstract final class AppMotion {
  static const fast = Duration(milliseconds: 150);
  static const base = Duration(milliseconds: 250);
  static const slow = Duration(milliseconds: 400);

  static const easeOut = Curves.easeOutCubic;
  static const easeIn = Curves.easeInCubic;

  /// Scale factor while a card is pressed: enough to read as pressure,
  /// small enough not to look like a bounce.
  static const pressScale = 0.97;
}

/// Tap feedback used across the app: a soft scale-down while pressed, plus
/// a Material ripple when there is a flat background to splash on.
///
/// Why not plain `GestureDetector`: a touch with no visual answer feels
/// dead. Why not plain `InkWell` everywhere: an opaque background (image,
/// gradient) paints *over* the ripple — pass [ripple] `false` there and
/// keep the scale, or move the background into an [Ink] (see
/// QuickServices) so the splash lands on top of it.
class Pressable extends StatefulWidget {
  const Pressable({
    super.key,
    required this.child,
    this.onTap,
    this.borderRadius,
    this.scale = AppMotion.pressScale,
    this.ripple = true,
    this.duration = AppMotion.fast,
  });

  final Widget child;
  final VoidCallback? onTap;

  /// Clips the ripple to this shape (should match the visual corner).
  final BorderRadius? borderRadius;

  final double scale;

  /// `false` → tap + scale only, no splash (for opaque/image backgrounds).
  final bool ripple;

  final Duration duration;

  @override
  State<Pressable> createState() => _PressableState();
}

class _PressableState extends State<Pressable> {
  bool _pressed = false;

  void _setPressed(bool value) {
    if (value == _pressed || !mounted) return;
    setState(() => _pressed = value);
  }

  @override
  Widget build(BuildContext context) {
    // Same accessibility escape hatch as ScrollReveal.
    final reduceMotion = MediaQuery.disableAnimationsOf(context);

    final Widget target = widget.child;
    final Widget interactive = (!widget.ripple || widget.onTap == null)
        ? GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: widget.onTap,
            onTapDown: (_) => _setPressed(true),
            onTapUp: (_) => _setPressed(false),
            onTapCancel: () => _setPressed(false),
            child: target,
          )
        : Material(
            // Own (transparent) Material so the ripple has a canvas even
            // when the card sits directly on the page background.
            type: MaterialType.transparency,
            child: InkWell(
              borderRadius: widget.borderRadius,
              onTap: widget.onTap,
              onHighlightChanged: _setPressed,
              child: target,
            ),
          );

    return AnimatedScale(
      scale: (_pressed && !reduceMotion) ? widget.scale : 1.0,
      duration: widget.duration,
      curve: AppMotion.easeOut,
      child: interactive,
    );
  }
}
