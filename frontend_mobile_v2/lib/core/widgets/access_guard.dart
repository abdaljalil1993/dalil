import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../di/providers.dart';
import 'login_prompt_sheet.dart';

/// Handoff rule #1: guests may BROWSE (home, categories, business details,
/// reviews, featured, ads), but any interaction → sign-in sheet, then the
/// action resumes after a successful sign-in.
///
/// Usage in a widget:
/// ```dart
/// onPressed: () => AccessGuard.of(context, ref, action: () => _toggleFav()),
/// ```
class AccessGuard {
  AccessGuard._();

  /// Returns `true` if the action ran (member) or will run after sign-in.
  static Future<void> of(
    BuildContext context,
    WidgetRef ref, {
    required Future<void> Function() action,
  }) async {
    final authenticated = ref.read(authSessionProvider).isAuthenticated;
    if (authenticated) {
      await action();
      return;
    }
    await showLoginPrompt(context, onLoggedIn: action);
  }

  /// Sync check for hiding/disabling UI (not for running actions).
  static bool can(WidgetRef ref) =>
      ref.read(authSessionProvider).isAuthenticated;
}
