/// Data-layer only exceptions. They are converted to [Failure] inside
/// repository implementations — they never cross into domain/presentation.
class ServerException implements Exception {
  const ServerException(this.message,
      {this.status, this.code, this.fieldErrors = const {}});
  final String message;
  final int? status;
  final String? code;
  final Map<String, String> fieldErrors;
  @override
  String toString() => 'ServerException($status/$code: $message)';
}

class NetworkException implements Exception {
  const NetworkException([this.message = 'No internet connection']);
  final String message;
  @override
  String toString() => 'NetworkException($message)';
}

class CacheException implements Exception {
  const CacheException([this.message = 'Cached data not available']);
  final String message;
  @override
  String toString() => 'CacheException($message)';
}
