import 'dart:async';

import 'package:flutter/material.dart';

/// Fades + slides a child in the first time it is built, with an optional
/// per-index stagger so a list enters as a wave instead of a solid block.
///
/// Why "on build": scrollable children are built lazily, i.e. exactly when
/// they enter the viewport (minus the cache extent) — so building == being
/// scrolled into view. No ScrollController, no listener, no package.
///
/// The animation runs once per element lifetime: scrolling an item far
/// enough to dispose it and back replays the entrance, which reads as the
/// item entering again (intended). Rebuilds of the same element — pull to
/// refresh, setState of a parent — do NOT replay it.
///
/// Layout is never shifted: FadeTransition/SlideTransition are paint-only
/// transforms, so list geometry (and the fixes that depend on it) stays
/// exactly as it was.
class ScrollReveal extends StatefulWidget {
  const ScrollReveal({
    super.key,
    required this.child,
    this.index = 0,
    this.slide = const Offset(0, 0.06),
    this.step = const Duration(milliseconds: 60),
    this.duration = const Duration(milliseconds: 420),
    this.enabled = true,
  });

  final Widget child;

  /// Position in the sequence: higher index starts later (capped, so a long
  /// list never makes item #40 wait 2.4s to appear).
  final int index;

  /// Direction as a fraction of the child's size. Vertical lists use the
  /// default (from below); horizontal lists pass e.g. Offset(0.06, 0).
  final Offset slide;

  /// Delay between consecutive indices.
  final Duration step;

  final Duration duration;

  /// Turn off for one-off (non-staggered) entrances — still animates once.
  final bool enabled;

  @override
  State<ScrollReveal> createState() => _ScrollRevealState();
}

class _ScrollRevealState extends State<ScrollReveal>
    with SingleTickerProviderStateMixin {
  static const int _maxStagger = 8;

  late final AnimationController _controller;
  late final Animation<double> _fade;
  late Animation<Offset> _slide;
  Timer? _delay;
  bool _started = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: widget.duration,
    );
    _fade = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOutCubic,
      // Enter fast, settle slow — reads as "smooth" rather than "floaty".
      reverseCurve: Curves.easeInCubic,
    );
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return; // first build only (also fires on theme changes)
    _started = true;

    // Direction is known here (not in initState): in RTL the entrance
    // "from the leading edge" is mirrored so cards come from the left.
    final begin = Directionality.of(context) == TextDirection.rtl
        ? Offset(-widget.slide.dx, widget.slide.dy)
        : widget.slide;
    _slide = Tween<Offset>(begin: begin, end: Offset.zero).animate(_fade);

    // Respect the OS "reduce motion" setting: show immediately.
    // Read here, not in initState — inherited lookups are legal only once
    // the element is in the tree.
    final reduceMotion = MediaQuery.disableAnimationsOf(context);
    if (!widget.enabled || reduceMotion) {
      _controller.value = 1;
      return;
    }

    final wait = widget.index.clamp(0, _maxStagger) * widget.step.inMilliseconds;
    if (wait == 0) {
      _controller.forward();
    } else {
      _delay = Timer(Duration(milliseconds: wait), () {
        if (mounted) _controller.forward();
      });
    }
  }

  @override
  void dispose() {
    _delay?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // `_slide` already carries the RTL-mirrored offset (resolved once in
    // didChangeDependencies), so this is a pure paint transform.
    return FadeTransition(
      opacity: _fade,
      child: SlideTransition(
        position: _slide,
        child: widget.child,
      ),
    );
  }
}
