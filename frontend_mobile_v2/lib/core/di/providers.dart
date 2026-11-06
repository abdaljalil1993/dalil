import 'package:dio/dio.dart';
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
/// The client owns the language interceptor — kept reachable so locale
/// changes can push `Accept-Language` (rule #11).
final dioClientProvider = Provider<DioClient>((ref) {
  final session = ref.watch(authSessionProvider);
  final locale = ref.watch(localStorageProvider).locale?.languageCode ?? 'ar';
  return DioClient(session: session, locale: locale);
});

/// The raw Dio used by [ApiClient].
final dioProvider = Provider<Dio>((ref) => ref.watch(dioClientProvider).dio);

/// Unwraps `{success,message,data,meta}` and returns `Result`/`Paged`.
final apiClientProvider = Provider<ApiClient>(
  (ref) => ApiClient(ref.watch(dioProvider)),
);

final networkInfoProvider = Provider<NetworkInfo>((ref) => NetworkInfo());
