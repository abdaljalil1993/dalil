import 'package:dio/dio.dart';

import '../../state/session_controller.dart';
import '../config/app_config.dart';
import 'api_endpoints.dart';

class ApiClient {
  ApiClient({required SessionController session})
      : _session = session,
        dio = Dio(
          BaseOptions(
            baseUrl: AppConfig.apiBaseUrl,
            connectTimeout: const Duration(seconds: 20),
            receiveTimeout: const Duration(seconds: 20),
            headers: {'Content-Type': 'application/json'},
          ),
        ) {
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          final token = _session.accessToken;
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          final request = error.requestOptions;
          final unauthorized = error.response?.statusCode == 401;
          final alreadyRetried = request.extra['retried'] == true;

          if (!unauthorized || alreadyRetried) {
            handler.next(error);
            return;
          }

          final refreshToken = _session.refreshToken;
          if (refreshToken == null || refreshToken.isEmpty) {
            await _session.clear();
            handler.next(error);
            return;
          }

          try {
            final refreshDio = Dio(BaseOptions(baseUrl: AppConfig.apiBaseUrl));
            final refreshRes = await refreshDio.post(
              ApiEndpoints.authRefresh,
              data: {'refreshToken': refreshToken},
            );

            final payload = (refreshRes.data as Map<String, dynamic>)['data'] as Map<String, dynamic>?;
            final newToken = (payload?['accessToken'] ?? '').toString();
            final newRefresh = payload?['refreshToken']?.toString();
            final user = payload?['user'] as Map<String, dynamic>?;

            if (newToken.isEmpty) {
              await _session.clear();
              handler.next(error);
              return;
            }

            await _session.setAuth(token: newToken, refresh: newRefresh, userPayload: user);

            request.headers['Authorization'] = 'Bearer $newToken';
            request.extra['retried'] = true;
            final retryResponse = await dio.fetch(request);
            handler.resolve(retryResponse);
          } catch (_) {
            await _session.clear();
            handler.next(error);
          }
        },
      ),
    );
  }

  final SessionController _session;
  final Dio dio;
}
