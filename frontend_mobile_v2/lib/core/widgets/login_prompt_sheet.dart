import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../router/app_router.dart';
import '../theme/app_theme.dart';

/// `true` when the guest may browse this screen without signing in.
/// Everything else (search, review, favorite, report, claim, add business)
/// requires an account.
bool isGuestAllowed(String key) => const {
      'home',
      'categories',
      'businessDetails',
      'reviews',
      'featured',
      'ads',
      'emergency',
      'offers',
    }.contains(key);

/// Shows the "sign in to continue" sheet, then **resumes the pending action**
/// if the user signs in.
///
/// ```dart
/// await showLoginPrompt(context, onLoggedIn: () => _toggleFavorite());
/// ```
Future<bool> showLoginPrompt(
  BuildContext context, {
  Future<void> Function()? onLoggedIn,
}) async {
  final result = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    builder: (sheetContext) => const _LoginPromptSheet(),
  );

  final signedIn = result == true;
  if (signedIn && onLoggedIn != null) await onLoggedIn();
  return signedIn;
}

/// Guards an action: runs it directly for members, or prompts the guest and
/// runs it after a successful sign-in (the handoff rule #1).
Future<void> guardAuth(
  BuildContext context, {
  required Future<void> Function() action,
}) async {
  final ok = await showLoginPrompt(context, onLoggedIn: action);
  if (ok) return;
}

class _LoginPromptSheet extends StatelessWidget {
  const _LoginPromptSheet();

  static const _benefits = [
    'ابحث في كل الأنشطة بمدينتك',
    'قيّم وشارك تجربتك',
    'احفظ أماكنك المفضّلة',
    'أضف نشاطك التجاري مجاناً',
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 44,
              height: 5,
              decoration: BoxDecoration(
                color: theme.hintColor.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(3),
              ),
            ),
            const SizedBox(height: 24),
            Container(
              width: 72,
              height: 72,
              decoration: const BoxDecoration(
                gradient: AppColors.gradient,
                borderRadius: BorderRadius.all(Radius.circular(24)),
              ),
              child: const Icon(Icons.lock_rounded, color: Colors.white, size: 34),
            ),
            const SizedBox(height: 18),
            Text(
              'سجّل دخولك للمتابعة',
              style: theme.textTheme.titleLarge,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'البحث والتقييم والمفضلة وإضافة الأنشطة متاحة للمستخدمين المسجلين فقط. '
              'التسجيل مجاني ويستغرق أقل من دقيقة.',
              style: theme.textTheme.bodyMedium
                  ?.copyWith(color: theme.hintColor),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            for (final b in _benefits)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle_rounded,
                        color: AppColors.success, size: 20),
                    const SizedBox(width: 10),
                    Expanded(child: Text(b, style: theme.textTheme.bodyMedium)),
                  ],
                ),
              ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () {
                Navigator.of(context).pop();
                context.push(AppRoutes.register);
              },
              child: const Text('أنشئ حساباً'),
            ),
            const SizedBox(height: 10),
            OutlinedButton(
              onPressed: () {
                Navigator.of(context).pop();
                context.push(AppRoutes.login);
              },
              child: const Text('سجّل الدخول'),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('المتابعة كزائر'),
            ),
          ],
        ),
      ),
    );
  }
}
