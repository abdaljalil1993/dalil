import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

/// Debug-only request/response logging (enabled with `--dart-define=DEBUG_NET=true`).
class LoggingInterceptor extends Interceptor {
  const LoggingInterceptor();

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    debugPrint('→ ${options.method} ${options.uri}'
        '${options.queryParameters.isEmpty ? '' : ' ${options.queryParameters}'}');
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    debugPrint('← ${response.statusCode} ${response.requestOptions.path}');
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    debugPrint('✖ ${err.response?.statusCode ?? 'NET'} ${err.requestOptions.path}'
        ' ${err.message ?? ''}');
    handler.next(err);
  }
}
