import '../../../../core/error/failures.dart';
import '../../../../core/error/result.dart';
import '../entities/auth_result.dart';
import '../repositories/auth_repository.dart';
import 'usecase.dart';

class RequestOtpParams {
  const RequestOtpParams({required this.phone});
  final String phone;
}

/// Sends an OTP to a Syrian mobile number.
///
/// Accepted shapes (handoff rule): `09xxxxxxxx`, `9639xxxxxxxx`,
/// `+9639xxxxxxxx`.
class RequestOtpUseCase
    extends UseCase<Result<OtpChallenge>, RequestOtpParams> {
  const RequestOtpUseCase(this._repository);

  final AuthRepository _repository;

  static final _validPhone = RegExp(r'^(\+?963|0)?9\d{8}$');

  /// Normalizes every accepted shape to the local `09xxxxxxxx` form so the
  /// app stores and compares one canonical representation.
  static String normalize(String raw) {
    final cleaned = raw.replaceAll(RegExp(r'[\s\-()]'), '');
    if (cleaned.startsWith('+963')) return '0${cleaned.substring(4)}';
    if (cleaned.startsWith('963')) return '0${cleaned.substring(3)}';
    return cleaned;
  }

  @override
  Future<Result<OtpChallenge>> call(RequestOtpParams params) async {
    final phone = normalize(params.phone);
    if (!_validPhone.hasMatch(phone)) {
      return const FailureResult(
        Failure(
          message: 'أدخل رقم موبايل صحيحاً (مثال: 0912345678)',
          fieldErrors: {'phone': 'رقم الموبايل غير صحيح'},
        ),
      );
    }
    return _repository.requestOtp(phone: phone);
  }
}
