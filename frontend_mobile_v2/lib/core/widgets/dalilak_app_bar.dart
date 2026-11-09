import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../di/providers.dart';
import '../router/app_router.dart';
import '../theme/app_theme.dart';

/// The app's single top bar — used by the four tab screens.
///
/// Layout (RTL): [☰ menu] · [logo + دليلك / screen title] · [🔍 search].
/// The menu opens the shell's drawer through [shellScaffoldKeyProvider]
/// because tab screens own nested Scaffolds — `Scaffold.of` inside them
/// would find their own (drawer-less) Scaffold, not the shell's.
///
/// Pushed pages (details, offers, auth) do NOT use this: they keep a back
/// button and no drawer (decision: drawer = tabs only).
class DalilakAppBar extends ConsumerWidget implements PreferredSizeWidget {
  const DalilakAppBar({
    super.key,
    this.title,
    this.actions = const [],
    this.showSearch = true,
    this.cornerRadius = 20,
  });

  /// Center content. Defaults to the brand (logo + «دليلك»); pass a Text to
  /// show the screen's own name instead — AppBar paints it white.
  final Widget? title;

  /// Trailing actions (after search): notifications, city selector, …
  final List<Widget> actions;

  final bool showSearch;

  /// Rounded bottom corners — the bar reads as a sheet, not as a strip.
  final double cornerRadius;

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return AppBar(
      automaticallyImplyLeading: false, // we render our own menu button
      backgroundColor: AppColors.primary,
      foregroundColor: Colors.white,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(cornerRadius)),
      ),
      centerTitle: true,
      title: title ?? const _BrandTitle(),
      leading: IconButton(
        tooltip: 'القائمة',
        icon: const Icon(Icons.menu_rounded),
        onPressed: () =>
            ref.read(shellScaffoldKeyProvider).currentState?.openDrawer(),
      ),
      actions: [
        if (showSearch)
          IconButton(
            tooltip: 'بحث',
            icon: const Icon(Icons.search_rounded),
            // `go` (not push): البحث تبويب، والانتقال يبدّل الفرع إلى جذرته.
            onPressed: () => context.go(AppRoutes.search),
          ),
        ...actions,
      ],
    );
  }
}

/// Logo tile + wordmark, white on the brand color.
class _BrandTitle extends StatelessWidget {
  const _BrandTitle();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 30,
          height: 30,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.2),
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Icon(Icons.location_city, color: Colors.white, size: 18),
        ),
        const SizedBox(width: 10),
        Text(
          'دليلك',
          style: theme.textTheme.titleLarge?.copyWith(
            color: Colors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}
