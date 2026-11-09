import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../di/providers.dart';
import 'app_drawer.dart';

/// Root scaffold for the four main tabs — hosts the navigation [Drawer].
///
/// The bottom bar is gone on purpose: the four tabs now live in the drawer
/// (matched to the web product), opened from the ☰ button in
/// `DalilakAppBar` or by swiping from the leading edge. Detail pages
/// (business details, offers, auth) are pushed on the root navigator and
/// cover this shell — they have no drawer (decision: drawer = tabs only).
class AppShell extends ConsumerWidget {
  const AppShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  void _go(int index) => navigationShell.goBranch(
        index,
        // Always the tab's root (user expectation): tapping التصنيفات must
        // show the full list, never the last-opened details page.
        initialLocation: true,
      );

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      // Shared key: nested screens open the drawer through it.
      key: ref.read(shellScaffoldKeyProvider),
      drawer: AppDrawer(
        currentIndex: navigationShell.currentIndex,
        onSelect: _go,
      ),
      body: navigationShell,
    );
  }
}
