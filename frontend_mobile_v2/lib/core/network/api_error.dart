import 'package:dio/dio.dart';

import '../error/failures.dart';
import 'api_envelope.dart';

/// Helpers to turn a raw [DioException] into our [Failure].
///
/// The API always answers with `{ success, message, data, code?, errors[] }`.
class ApiError {
  ApiError._();

  /// Reads the JSON body of any response as a plain map (safe on null/garbage).
  static Map<String, dynamic> envelopeOf(Object? data) =>
      data is Map<String, dynamic> ? data : <String, dynamic>{};

  static const _networkMessage = 'No internet connection';
  static const _timeoutMessage = 'Connection timed out — try again';

  /// The single entry point used by every repository.
  static Failure from(DioException error) {
    final status = error.response?.statusCode;
    final body = envelopeOf(error.response?.data);

    if (status != null) {
      // Server answered with a proper envelope.
      if (body.isNotEmpty) {
        return ApiEnvelope.fromJson(body).toFailure(status: status);
      }
      return Failure(message: _messageFor(status), status: status);
    }

    // No response at all: offline, DNS, timeout…
    return switch (error.type) {
      DioExceptionType.connectionTimeout ||
      DioExceptionType.sendTimeout ||
      DioExceptionType.receiveTimeout =>
        const Failure(message: _timeoutMessage),
      DioExceptionType.connectionError ||
      DioExceptionType.unknown =>
        const Failure(message: _networkMessage),
      _ => Failure(message: error.message ?? 'Something went wrong'),
    };
  }

  static String _messageFor(int status) => switch (status) {
        400 => 'Invalid request',
        401 => 'Please sign in to continue',
        403 => 'You do not have permission to do that',
        404 => 'Not found',
        409 => 'This record already exists',
        422 => 'Please check the highlighted fields',
        429 => 'Too many attempts — please wait and try again',
        500 => 'Server error — try again later',
        503 => 'Service temporarily unavailable',
        _ => 'Something went wrong',
      };
}
