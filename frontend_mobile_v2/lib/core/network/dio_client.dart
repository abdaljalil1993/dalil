import 'package:dio/dio.dart';

import '../config/app_env.dart';
import '../session/auth_session.dart';
import 'interceptors/auth_interceptor.dart';
import 'interceptors/language_interceptor.dart';
import 'interceptors/logging_interceptor.dart';

/// Builds the app-wide [Dio] instance.
///
/// Ordering matters: logging → language → auth (attach token) → auth (refresh
/// on 401, queued so only one refresh runs at a time).
class DioClient {
  DioClient({
    required AuthSession session,
    required String locale,
    bool enableLogs = AppEnv.enableNetworkLogs,
  }) {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppEnv.apiUrl,
        connectTimeout: const Duration(seconds: 20),
        receiveTimeout: const Duration(seconds: 20),
        headers: {'Content-Type': 'application/json'},
        responseType: ResponseType.json,
      ),
    );

    if (enableLogs) _dio.interceptors.add(const LoggingInterceptor());

    language = LanguageInterceptor(locale);
    _dio.interceptors.add(language);

    _dio.interceptors.add(
      AuthInterceptor(
        session: session,
        dio: _dio,
        refresh: () => performRefresh(dio: _dio, session: session),
      ),
    );
  }

  late final Dio _dio;
  late final LanguageInterceptor language;

  Dio get dio => _dio;
}
