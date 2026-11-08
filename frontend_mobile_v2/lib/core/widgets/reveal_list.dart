import 'package:flutter/material.dart';

import 'scroll_reveal.dart';

/// [ListView.builder] whose items enter with the shared stagger.
///
/// Exists so a *new* list inherits the entrance animation by construction
/// instead of remembering to wrap every `itemBuilder` in [ScrollReveal]
/// (see CONVENTIONS_AR.md §11). Keeps the slide direction correct per axis
/// and mirrors it automatically for RTL.
class RevealList extends StatelessWidget {
  const RevealList({
    super.key,
    required this.itemCount,
    required this.itemBuilder,
    this.separatorBuilder,
    this.scrollDirection = Axis.vertical,
    this.padding,
    this.physics,
    this.controller,
    this.shrinkWrap = false,
  });

  final int itemCount;
  final IndexedWidgetBuilder itemBuilder;
  final IndexedWidgetBuilder? separatorBuilder;
  final Axis scrollDirection;
  final EdgeInsetsGeometry? padding;
  final ScrollPhysics? physics;
  final ScrollController? controller;
  final bool shrinkWrap;

  /// Horizontal lists enter from the leading edge; vertical ones rise.
  Offset get _slide => scrollDirection == Axis.horizontal
      ? const Offset(0.07, 0)
      : const Offset(0, 0.06);

  @override
  Widget build(BuildContext context) {
    Widget wrapped(BuildContext context, int index) => ScrollReveal(
          index: index,
          slide: _slide,
          child: itemBuilder(context, index),
        );

    if (separatorBuilder != null) {
      return ListView.separated(
        scrollDirection: scrollDirection,
        padding: padding,
        physics: physics,
        controller: controller,
        shrinkWrap: shrinkWrap,
        itemCount: itemCount,
        itemBuilder: wrapped,
        separatorBuilder: separatorBuilder!,
      );
    }

    return ListView.builder(
      scrollDirection: scrollDirection,
      padding: padding,
      physics: physics,
      controller: controller,
      shrinkWrap: shrinkWrap,
      itemCount: itemCount,
      itemBuilder: wrapped,
    );
  }
}

/// [GridView.builder] with the same per-item entrance as [RevealList].
///
/// For grids nested inside another scroll view, keep `shrinkWrap: true` +
/// `physics: NeverScrollableScrollPhysics()` exactly as before — only the
/// entrance animation is added here.
class RevealGrid extends StatelessWidget {
  const RevealGrid({
    super.key,
    required this.itemCount,
    required this.itemBuilder,
    required this.gridDelegate,
    this.padding,
    this.physics,
    this.shrinkWrap = false,
    this.controller,
    this.scrollDirection = Axis.vertical,
  });

  final int itemCount;
  final IndexedWidgetBuilder itemBuilder;
  final SliverGridDelegate gridDelegate;
  final EdgeInsetsGeometry? padding;
  final ScrollPhysics? physics;
  final bool shrinkWrap;
  final ScrollController? controller;
  final Axis scrollDirection;

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      scrollDirection: scrollDirection,
      padding: padding,
      physics: physics,
      shrinkWrap: shrinkWrap,
      controller: controller,
      gridDelegate: gridDelegate,
      itemCount: itemCount,
      itemBuilder: (context, index) => ScrollReveal(
        index: index,
        slide: scrollDirection == Axis.horizontal
            ? const Offset(0.07, 0)
            : const Offset(0, 0.1),
        child: itemBuilder(context, index),
      ),
    );
  }
}
