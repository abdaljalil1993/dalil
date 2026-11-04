import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../network/api_client.dart';
import '../network/dio_client.dart';
import '../network/network_info.dart';
import '../session/auth_session.dart';
import '../storage/local_storage.dart';
import '../storage/token_storage.dart';

// ───────────────────────── storage ─────────────────────────
final tokenStorageProvider = Provider<TokenStorage>((ref) => TokenStorage());

/// Overridden in `main()` once `SharedPreferences` has loaded (async).
final localStorageProvider = Provider<LocalStorage>(
  (ref) => throw UnimplementedError('localStorageProvider is set in main()'),
);

// ───────────────────────── session ─────────────────────────
final authSessionProvider = ChangeNotifierProvider<AuthSession>(
  (ref) => AuthSession(ref.watch(tokenStorageProvider)),
);

// ───────────────────────── network ─────────────────────────
/// Built lazily from the session + persisted locale (both available by then).
final dioClientProvider = Provider<DioClient>((ref) {
  final session = ref.watch(authSessionProvider);
  final locale = ref.read(localStorageProvider).locale;
  return DioClient(session: session, locale: locale);
});

/// Unwraps `{success,message,data,meta}` and returns `Result`/`Paged`.
final apiClientProvider = Provider<ApiClient>(
  (ref) => ApiClient(ref.watch(dioClientProvider).dio),
);

final networkInfoProvider = Provider<NetworkInfo>((ref) => NetworkInfo());
