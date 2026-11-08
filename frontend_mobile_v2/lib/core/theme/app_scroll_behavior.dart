import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';

/// Single source of truth for how every scrollable in the app behaves.
///
/// Wired once via `MaterialApp.scrollBehavior` so every vertical *and*
/// horizontal list gets the same feel without touching its widget:
///  * a springy edge bounce on both axes (Clamping feels dead by
///    comparison, and the default platform split made web feel flat),
///  * a Material-3 stretch at the edges instead of the blue glow,
///  * drag works with touch, mouse and trackpad (the app is also tested
///    in Chrome).
class AppScrollBehavior extends MaterialScrollBehavior {
  const AppScrollBehavior();

  @override
  Set<PointerDeviceKind> get dragDevices => const {
        PointerDeviceKind.touch,
        PointerDeviceKind.mouse,
        PointerDeviceKind.trackpad,
        PointerDeviceKind.stylus,
        PointerDeviceKind.invertedStylus,
      };

  @override
  ScrollPhysics getScrollPhysics(BuildContext context) =>
      // Always scrollable → pull-to-refresh works even on short content;
      // bouncing → the edge has a soft spring instead of a hard stop.
      const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics());

  @override
  Widget buildOverscrollIndicator(
    BuildContext context,
    Widget child,
    ScrollableDetails details,
  ) {
    return StretchingOverscrollIndicator(
      axisDirection: details.direction,
      child: child,
    );
  }
}
