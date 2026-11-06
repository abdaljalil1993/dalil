import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app.dart';
import 'core/di/providers.dart';
import 'core/session/auth_session.dart';
import 'core/storage/local_storage.dart';
import 'core/storage/token_storage.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Non-sensitive prefs first: locale, theme, default city, caches.
  final localStorage = await LocalStorage.load();

  // Restore the session BEFORE the first frame so cold-start deep links
  // (e.g. /businesses/:slug from an ad) are not swallowed by a redirect.
  final session = AuthSession(TokenStorage());
  await session.bootstrap();

  runApp(
    ProviderScope(
      overrides: [
        localStorageProvider.overrideWithValue(localStorage),
        authSessionProvider.overrideWith((ref) => session),
      ],
      child: const DalilakApp(),
    ),
  );
}