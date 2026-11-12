import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../../constants/api_endpoints.dart';
import '../../session/auth_session.dart';
import '../api_error.dart';

/// - Attaches `Authorization: Bearer <accessToken>` when present.
/// - On **401** performs a **single-flight** refresh: concurrent 401s wait for
///   ONE refresh call (a lock/queue), then every queued request retries with
///   the new token. The **new refresh token always replaces the old** (rotation).
/// - Never retries `/auth/*` endpoints (a wrong password must stay a 401).
class AuthInterceptor extends QueuedInterceptor {
  AuthInterceptor({
    required AuthSession session,
    required Dio dio,
    required Future<String?> Function() refresh,
  })  : _session = session,
        _dio = dio,
        _refresh = refresh;

  final AuthSession _session;
  final Dio _dio;
  final Future<String?> Function() _refresh;

  static const _kRetried = 'authRetried';

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    debugPrint('[AUTH-DIAG] HTTP ${options.method} ${options.path}');
    final token = _session.accessToken;
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    final options = err.requestOptions;
    final is401 = err.response?.statusCode == 401;
    final alreadyRetried = options.extra[_kRetried] == true;
    final isAuthPath = options.path.contains('/auth/');

    if (!is401 || alreadyRetried || isAuthPath) {
      handler.next(err);
      return;
    }

    final newToken = await _refresh();

    if (newToken == null || newToken.isEmpty) {
      // Refresh failed → session is dead, propagate the original 401.
      handler.next(err);
      return;
    }

    // Retry the original request once with the fresh token.
    options.extra[_kRetried] = true;
    options.headers['Authorization'] = 'Bearer $newToken';
    try {
      final response = await _dio.fetch<dynamic>(options);
      handler.resolve(response);
    } on DioException catch (e) {
      handler.next(e);
    }
  }
}

/// The refresh call itself (kept separate so it can be unit-tested).
/// Returns the new access token, or null when the session is unrecoverable.
Future<String?> performRefresh({
  required Dio dio,
  required AuthSession session,
}) async {
  final refreshToken = session.refreshToken;
  if (refreshToken == null || refreshToken.isEmpty) {
    await session.clear();
    return null;
  }
  try {
    final res = await dio.post<Map<String, dynamic>>(
      ApiEndpoints.refresh,
      data: {'refreshToken': refreshToken},
      options: Options(headers: {'Authorization': null}),
    );
    final body = ApiError.envelopeOf(res.data);
    final data = body['data'] as Map<String, dynamic>?;
    final access = data?['accessToken'] as String?;
    final refresh = data?['refreshToken'] as String?;
    if (access == null || access.isEmpty) {
      await session.clear();
      return null;
    }
    // Rotation: store the NEW refresh token too.
    await session.setAuth(accessToken: access, refreshToken: refresh);
    return access;
  } catch (_) {
    await session.clear();
    return null;
  }
}
