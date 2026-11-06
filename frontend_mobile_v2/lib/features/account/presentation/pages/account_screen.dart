import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/di/providers.dart';
import '../../../../core/prefs/prefs_providers.dart';
import '../../../../core/router/app_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../auth/auth.dart';

/// Tab 4: account — guest prompt vs signed-in profile.
class AccountScreen extends ConsumerWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final session = ref.watch(authSessionProvider);
    final locale = ref.watch(localeProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('حسابي')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // ── Identity card ──
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: AppColors.gradient,
              borderRadius: BorderRadius.circular(20),
            ),
            child: session.isAuthenticated
                ? Row(
                    children: [
                      CircleAvatar(
                        radius: 26,
                        backgroundColor: Colors.white.withValues(alpha: 0.25),
                        child: Text(
                          (session.user?['firstName']?.toString() ?? '؟')
                              .characters
                              .first,
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 22,
                              fontWeight: FontWeight.w700),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${session.user?['firstName'] ?? ''} ${session.user?['lastName'] ?? ''}'
                                  .trim(),
                              style: theme.textTheme.titleMedium
                                  ?.copyWith(color: Colors.white),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              session.user?['email']?.toString() ??
                                  session.user?['phone']?.toString() ??
                                  '',
                              style: theme.textTheme.bodySmall
                                  ?.copyWith(color: Colors.white70),
                            ),
                          ],
                        ),
                      ),
                    ],
                  )
                : Column(
                    children: [
                      const Icon(Icons.person_outline_rounded,
                          color: Colors.white, size: 44),
                      const SizedBox(height: 10),
                      Text(
                        'سجّل دخولك لتفعيل كل المزايا',
                        style: theme.textTheme.titleMedium
                            ?.copyWith(color: Colors.white),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          Expanded(
                            child: FilledButton(
                              style: FilledButton.styleFrom(
                                backgroundColor: Colors.white,
                                foregroundColor: AppColors.primary,
                                minimumSize: const Size.fromHeight(44),
                              ),
                              onPressed: () => context.push(AppRoutes.login),
                              child: const Text('تسجيل الدخول'),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: OutlinedButton(
                              style: OutlinedButton.styleFrom(
                                foregroundColor: Colors.white,
                                side: const BorderSide(color: Colors.white70),
                                minimumSize: const Size.fromHeight(44),
                              ),
                              onPressed: () => context.push(AppRoutes.register),
                              child: const Text('حساب جديد'),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
          ),

          const SizedBox(height: 24),

          // ── Settings ──
          _SectionLabel(label: 'الإعدادات', theme: theme),

          // Language (rule #11 — Accept-Language follows this switch)
          SwitchListTile(
            value: locale.languageCode == 'en',
            contentPadding: EdgeInsets.zero,
            secondary: const Icon(Icons.language_rounded,
                color: AppColors.primary),
            title: const Text('English (اللغة)'),
            subtitle: Text(locale.languageCode == 'ar' ? 'العربية' : 'English',
                style: theme.textTheme.bodySmall),
            onChanged: (v) =>
                ref.read(localeProvider.notifier).setLocale(Locale(v ? 'en' : 'ar')),
          ),

          // ── Links ──
          _SectionLabel(label: 'المزيد', theme: theme),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading:
                const Icon(Icons.notifications_none_rounded, color: AppColors.primary),
            title: const Text('الإشعارات'),
            trailing: const Icon(Icons.chevron_left_rounded),
            onTap: () => ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('الإشعارات — قريباً')),
            ),
          ),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.info_outline_rounded, color: AppColors.primary),
            title: const Text('حول التطبيق'),
            subtitle: const Text('دليلك — نسخة 1.0 · بيانات © مساهمو OpenStreetMap'),
            onTap: () => showAboutDialog(
              context: context,
              applicationName: 'دليلك',
              applicationVersion: '1.0.0',
              applicationLegalese: 'بيانات الخرائط والأماكن © مساهمو OpenStreetMap',
            ),
          ),

          if (session.isAuthenticated) ...[
            const SizedBox(height: 12),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.logout_rounded, color: AppColors.error),
              title: const Text('تسجيل الخروج',
                  style: TextStyle(color: AppColors.error)),
              onTap: () async {
                final ok = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('تسجيل الخروج'),
                    content: const Text('هل تريد الخروج من حسابك؟'),
                    actions: [
                      TextButton(
                          onPressed: () => Navigator.pop(ctx, false),
                          child: const Text('إلغاء')),
                      FilledButton(
                          onPressed: () => Navigator.pop(ctx, true),
                          child: const Text('خروج')),
                    ],
                  ),
                );
                if (ok == true && context.mounted) {
                  await ref.read(authControllerProvider.notifier).logout();
                }
              },
            ),
          ],
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel({required this.label, required this.theme});

  final String label;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 4),
        child: Text(label,
            style: theme.textTheme.titleSmall?.copyWith(color: theme.hintColor)),
      );
}