import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app.dart';
import 'core/di/providers.dart';
import 'core/storage/local_storage.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Non-sensitive prefs load first: locale, theme, default city, caches.
  // Tokens are read later by AuthSession.bootstrap() (secure storage).
  final localStorage = await LocalStorage.load();

  runApp(
    ProviderScope(
      overrides: [localStorageProvider.overrideWithValue(localStorage)],
      child: const DalilakApp(),
    ),
  );
}
