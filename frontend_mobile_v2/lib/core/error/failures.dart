import 'package:flutter/foundation.dart';

/// Business-level failure carried through the layers.
/// `message` is what we show to the user (it comes from the API envelope).
@immutable
class Failure {
  const Failure({
    required this.message,
    this.code,
    this.status,
    this.fieldErrors = const {},
  });

  final String message;
  final String? code;
  final int? status;

  /// `{ field: message }` extracted from the API `errors[]` array — for form validation.
  final Map<String, String> fieldErrors;

  bool get isNetwork => status == null;
  bool get isUnauthorized => status == 401;
  bool get isForbidden => status == 403;
  bool get isNotFound => status == 404;
  bool get isConflict => status == 409;
  bool get isValidation => status == 422 || fieldErrors.isNotEmpty;

  /// 402 + PLAN_LIMIT / PLAN_FEATURE → "upgrade your plan" bottom sheet.
  bool get isPlanLimit =>
      status == 402 && (code == 'PLAN_LIMIT' || code == 'PLAN_FEATURE');

  /// 403 + FEATURE_DISABLED → "this service is not available in your area".
  bool get isFeatureDisabled => status == 403 && code == 'FEATURE_DISABLED';

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Failure &&
          other.message == message &&
          other.code == code &&
          other.status == status);

  @override
  int get hashCode => Object.hash(message, code, status);

  @override
  String toString() => 'Failure($status/$code: $message)';
}
