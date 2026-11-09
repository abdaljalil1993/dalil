import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';

import '../di/providers.dart';
import '../router/app_router.dart';
import '../theme/app_theme.dart';

/// Navigation drawer for the four tab screens (tabs live here now instead
/// of in a bottom bar — matched to the web product's PublicLayout).
///
/// Order: brand header (login / account) → the four tabs (current one is
/// marked) → secondary destinations → country/city.
/// Closing the drawer happens before any navigation so the route change
/// is not animated underneath the scrim.
class AppDrawer extends ConsumerWidget {
  const AppDrawer({
    super.key,
    required this.currentIndex,
    required this.onSelect,
  });

  /// Index of the branch currently shown, for the selected state.
  final int currentIndex;

  /// Switches branch (always to the branch root — same rule as the old
  /// bottom bar: tapping التصنيفات must show the full list).
  final void Function(int index) onSelect;

  static const List<(IconData, IconData, String)> _tabs = [
    (Icons.home_rounded, Icons.home_outlined, 'الرئيسية'),
    (Icons.grid_view_rounded, Icons.grid_view_outlined, 'التصنيفات'),
    (Icons.search_rounded, Icons.search_rounded, 'بحث'),
    (Icons.person_rounded, Icons.person_outline_rounded, 'حسابي'),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(authSessionProvider);
    final theme = Theme.of(context);

    void close() => Navigator.of(context).pop();

    void todo(String message) {
      close();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message)),
      );
    }

    return Drawer(
      backgroundColor: theme.scaffoldBackgroundColor,
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          _DrawerHeader(
            isAuthenticated: session.isAuthenticated,
            name: _displayName(session.user),
            email: session.user?['email']?.toString() ?? '',
            role: session.role,
            onClose: close,
            onLogin: () {
              close();
              context.push(AppRoutes.login);
            },
            onAccount: () {
              close();
              onSelect(3);
            },
          ),
          const SizedBox(height: 8),

          // ── Main tabs ──
          for (var i = 0; i < _tabs.length; i++)
            _DrawerItem(
              icon: i == currentIndex ? _tabs[i].$1 : _tabs[i].$2,
              label: _tabs[i].$3,
              selected: i == currentIndex,
              onTap: () {
                close();
                onSelect(i);
              },
            ),

          const Divider(indent: 20, endIndent: 20, height: 32),

          // ── Secondary ──
          _DrawerItem(
            icon: Icons.notifications_none_rounded,
            label: 'الإشعارات',
            onTap: () => todo('الإشعارات قريباً'),
          ),
          _DrawerItem(
            icon: Icons.share_outlined,
            label: 'مشاركة الدليل',
            onTap: () {
              close();
              Share.share('دليلك — دليل أعمال سوريا');
            },
          ),
          _DrawerItem(
            icon: Icons.star_outline_rounded,
            label: 'قيّم التطبيق',
            onTap: () => todo('التقييم قريباً'),
          ),
          _DrawerItem(
            icon: Icons.call_outlined,
            label: 'اتصل بنا',
            onTap: () => todo('قريباً'),
          ),
          _DrawerItem(
            icon: Icons.group_add_outlined,
            label: 'انضم لفريق عمل دليلك',
            onTap: () => todo('قريباً'),
          ),
          _DrawerItem(
            icon: Icons.settings_outlined,
            label: 'الإعدادات',
            // Settings live in حسابي — jump straight to that branch.
            onTap: () {
              close();
              onSelect(3);
            },
          ),

          const Divider(indent: 20, endIndent: 20, height: 32),

          // ── Location ──
          _DrawerItem(
            icon: Icons.public_rounded,
            label: 'تغيير البلد',
            trailing: const Icon(Icons.chevron_left_rounded), // RTL: "more"
            onTap: () => todo('قريباً'),
          ),
          _DrawerItem(
            icon: Icons.location_on_outlined,
            label: 'تغيير المدينة',
            trailing: const Icon(Icons.chevron_left_rounded),
            // TODO: city selector (home app bar has the same TODO).
            onTap: () => todo('قريباً'),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  static String _displayName(Map<String, dynamic>? user) {
    if (user == null) return '';
    final name = [user['firstName'], user['lastName']]
        .whereType<String>()
        .where((s) => s.trim().isNotEmpty)
        .join(' ')
        .trim();
    return name.isNotEmpty ? name : (user['email']?.toString() ?? '');
  }
}

/// Gradient header: logo, wordmark, and the login button / account card.
class _DrawerHeader extends StatelessWidget {
  const _DrawerHeader({
    required this.isAuthenticated,
    required this.name,
    required this.email,
    required this.role,
    required this.onClose,
    required this.onLogin,
    required this.onAccount,
  });

  final bool isAuthenticated;
  final String name;
  final String email;
  final String? role;
  final VoidCallback onClose;
  final VoidCallback onLogin;
  final VoidCallback onAccount;

  String get _roleLabel => switch (role) {
        'admin' => 'مدير',
        'owner' => 'صاحب نشاط',
        _ => 'حساب',
      };

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.paddingOf(context).top;

    return Container(
      width: double.infinity,
      padding: EdgeInsets.fromLTRB(20, topPadding + 24, 20, 24),
      decoration: const BoxDecoration(
        gradient: AppColors.gradient,
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(24)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(Icons.location_city,
                    color: Colors.white, size: 28),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'دليلك',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                  Text(
                    'دليل أعمال سوريا',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.white.withValues(alpha: 0.8),
                        ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 20),
          if (!isAuthenticated)
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: onLogin,
                icon: const Icon(Icons.login_rounded, size: 18),
                label: const Text('تسجيل الدخول'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white,
                  side: const BorderSide(color: Colors.white70),
                  minimumSize: const Size(0, 46),
                ),
              ),
            )
          else
            InkWell(
              borderRadius: BorderRadius.circular(12),
              onTap: onAccount,
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 20,
                      backgroundColor: Colors.white.withValues(alpha: 0.25),
                      child: Text(
                        name.isEmpty ? '؟' : name.characters.first,
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w700),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            name.isEmpty ? 'حسابي' : name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w700),
                          ),
                          Text(
                            email.isEmpty ? _roleLabel : email,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.75),
                                fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_left_rounded,
                        color: Colors.white70),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _DrawerItem extends StatelessWidget {
  const _DrawerItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.selected = false,
    this.trailing,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool selected;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
      child: Material(
        color: selected
            ? AppColors.primary.withValues(alpha: 0.1)
            : Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            child: Row(
              children: [
                Icon(
                  icon,
                  size: 22,
                  color: selected ? AppColors.primary : null,
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Text(
                    label,
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: selected ? AppColors.primary : null,
                          fontWeight:
                              selected ? FontWeight.w700 : FontWeight.w500,
                        ),
                  ),
                ),
                if (trailing != null) trailing!,
              ],
            ),
          ),
        ),
      ),
    );
  }
}
