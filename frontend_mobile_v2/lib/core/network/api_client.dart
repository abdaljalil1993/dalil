import 'package:dio/dio.dart';

import '../error/failures.dart';
import '../error/result.dart';
import 'api_envelope.dart';
import 'api_error.dart';

/// Thin wrapper over [Dio] that:
///  - unwraps `{ success, message, data, meta }`
///  - converts every failure into a [Failure] (no exception escapes)
///  - offers [getPaged] for list endpoints so callers get `meta.hasNext`
class ApiClient {
  ApiClient(this._dio);

  final Dio _dio;

  Future<Result<T>> get<T>(
    String path, {
    Map<String, dynamic>? query,
    T Function(Object? raw)? parse,
  }) =>
      _send<T>('GET', path, query: query, parse: parse);

  Future<Result<T>> post<T>(
    String path, {
    Object? body,
    Map<String, dynamic>? query,
    T Function(Object? raw)? parse,
    Options? options,
  }) =>
      _send<T>('POST', path, body: body, query: query, parse: parse, extra: options);

  Future<Result<T>> put<T>(
    String path, {
    Object? body,
    T Function(Object? raw)? parse,
  }) =>
      _send<T>('PUT', path, body: body, parse: parse);

  Future<Result<T>> patch<T>(
    String path, {
    Object? body,
    T Function(Object? raw)? parse,
  }) =>
      _send<T>('PATCH', path, body: body, parse: parse);

  Future<Result<T>> delete<T>(String path, {T Function(Object? raw)? parse}) =>
      _send<T>('DELETE', path, parse: parse);

  /// List endpoint → items + pagination meta (`meta.hasNext` drives infinite scroll).
  Future<Result<Paged<T>>> getPaged<T>(
    String path, {
    Map<String, dynamic>? query,
    required T Function(Object? raw) parse,
  }) async {
    final raw = await _fetch('GET', path, query: query);
    return raw.map((decoded) {
      final list =
          decoded.envelopeData is List ? decoded.envelopeData as List : const <Object?>[];
      return Paged<T>(
        items: list.map(parse).toList(),
        meta: decoded.meta,
      );
    });
  }

  // ───────────────────────── internals ─────────────────────────

  Future<Result<T>> _send<T>(
    String method,
    String path, {
    Object? body,
    Map<String, dynamic>? query,
    T Function(Object? raw)? parse,
    Options? extra,
  }) async {
    final res = await _fetch(method, path, body: body, query: query, extra: extra);
    return res.when(
      success: (decoded) {
        if (parse != null) return Success<T>(parse(decoded.envelopeData));
        return Success<T>(decoded.envelopeData as T);
      },
      onFailure: FailureResult<T>.new,
    );
  }

  /// Performs the HTTP call and decodes the envelope — failures included.
  Future<Result<_Decoded>> _fetch(
    String method,
    String path, {
    Object? body,
    Map<String, dynamic>? query,
    Options? extra,
  }) async {
    try {
      final res = await _dio.fetch<dynamic>(
        RequestOptions(
          path: path,
          method: method,
          data: body,
          queryParameters: query ?? const <String, dynamic>{},
          headers: {
            ..._dio.options.headers,
            ...?extra?.headers,
          },
          baseUrl: _dio.options.baseUrl,
          contentType: extra?.contentType ?? _dio.options.contentType,
        ),
      );
      final envelope =
          ApiEnvelope<dynamic>.fromJson(ApiError.envelopeOf(res.data));
      if (!envelope.success) {
        return FailureResult(envelope.toFailure(status: res.statusCode));
      }
      return Success(_Decoded(envelope.data, envelope.meta));
    } on DioException catch (e) {
      return FailureResult(ApiError.from(e));
    } catch (e) {
      return FailureResult(Failure(message: e.toString()));
    }
  }
}

class _Decoded {
  const _Decoded(this.envelopeData, this.meta);
  final Object? envelopeData;
  final ApiMeta? meta;
}
