import '../error/failures.dart';

/// The one envelope every endpoint returns:
/// `{ success, message, data, meta? }` — errors add `code` and `errors[]`.
class ApiEnvelope<T> {
  const ApiEnvelope({
    required this.success,
    this.message,
    this.data,
    this.meta,
    this.code,
    this.errors = const [],
  });

  final bool success;
  final String? message;
  final T? data;
  final ApiMeta? meta;
  final String? code;
  final List<ApiFieldError> errors;

  factory ApiEnvelope.fromJson(
    Map<String, dynamic> json, [
    T Function(Object? raw)? parse,
  ]) {
    return ApiEnvelope<T>(
      success: json['success'] == true,
      message: json['message'] as String?,
      data: parse == null ? json['data'] as T? : parse(json['data']),
      meta: json['meta'] is Map<String, dynamic>
          ? ApiMeta.fromJson(json['meta'] as Map<String, dynamic>)
          : null,
      code: json['code'] as String?,
      errors: (json['errors'] as List?)
              ?.whereType<Map<String, dynamic>>()
              .map(ApiFieldError.fromJson)
              .toList() ??
          const [],
    );
  }

  /// Converts an *error* envelope into the [Failure] we hand to the UI.
  Failure toFailure({int? status}) {
    final fieldErrors = <String, String>{
      for (final e in errors)
        if (e.field != null && e.field!.isNotEmpty) e.field!: e.message,
    };
    return Failure(
      message: message ?? 'Something went wrong',
      code: code,
      status: status,
      fieldErrors: fieldErrors,
    );
  }
}

/// Pagination info — `hasNext` drives infinite scroll.
class ApiMeta {
  const ApiMeta({
    this.total,
    this.page,
    this.limit,
    this.totalPages,
    this.hasNext,
  });

  final int? total;
  final int? page;
  final int? limit;
  final int? totalPages;
  final bool? hasNext;

  factory ApiMeta.fromJson(Map<String, dynamic> json) => ApiMeta(
        total: (json['total'] as num?)?.toInt(),
        page: (json['page'] as num?)?.toInt(),
        limit: (json['limit'] as num?)?.toInt(),
        totalPages: (json['totalPages'] as num?)?.toInt(),
        hasNext: json['hasNext'] as bool?,
      );

  bool get hasNextPage => hasNext ?? false;
}

class ApiFieldError {
  const ApiFieldError({this.field, this.message = ''});
  final String? field;
  final String message;

  factory ApiFieldError.fromJson(Map<String, dynamic> json) => ApiFieldError(
        field: json['field'] as String?,
        message: (json['message'] ?? '').toString(),
      );
}

/// A paged list: the items plus their pagination meta.
class Paged<T> {
  const Paged({required this.items, this.meta});
  final List<T> items;
  final ApiMeta? meta;

  bool get hasNext => meta?.hasNextPage ?? false;
  int get total => meta?.total ?? items.length;
}
