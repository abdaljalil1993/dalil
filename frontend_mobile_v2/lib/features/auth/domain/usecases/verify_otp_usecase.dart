import '../../../../core/error/failures.dart';
import '../../../../core/error/result.dart';
import '../entities/auth_result.dart';
import '../repositories/auth_repository.dart';
import 'usecase.dart';

class VerifyOtpParams {
  const VerifyOtpParams({
    required this.phone,
    required this.code,
    this.firstName,
    this.lastName,
    this.cityId,
  });

  final String phone;
  final String code;

  /// Required when `OtpChallenge.isNewUser == true` (v2.1 rule).
  final String? firstName;
  final String? lastName;
  final int? cityId;
}

/// Verifies the OTP and signs in (or creates the account).
///
/// Rules:
///  - code is 4–6 digits
///  - a new user MUST provide first + last name
class VerifyOtpUseCase extends UseCase<Result<AuthResult>, VerifyOtpParams> {
  const VerifyOtpUseCase(this._repository);

  final AuthRepository _repository;

  @override
  Future<Result<AuthResult>> call(VerifyOtpParams params) async {
    final code = params.code.trim();
    if (!RegExp(r'^\d{4,6}$').hasMatch(code)) {
      return const FailureResult(
        Failure(
          message: 'الرمز من 4 إلى 6 أرقام',
          fieldErrors: {'code': 'الرمز غير صحيح'},
        ),
      );
    }

    final firstName = params.firstName?.trim();
    final lastName = params.lastName?.trim();
    final needsNames =
        (firstName == null || firstName.isEmpty) || (lastName == null || lastName.isEmpty);
    final hasAnyName = (firstName?.isNotEmpty ?? false) || (lastName?.isNotEmpty ?? false);

    if (hasAnyName && needsNames) {
      return const FailureResult(
        Failure(
          message: 'أدخل اسمك وكيتك لإكمال التسجيل',
          fieldErrors: {'firstName': 'الاسم مطلوب', 'lastName': 'الكنية مطلوبة'},
        ),
      );
    }

    return _repository.verifyOtp(
      phone: params.phone,
      code: code,
      firstName: firstName?.isEmpty ?? true ? null : firstName,
      lastName: lastName?.isEmpty ?? true ? null : lastName,
      cityId: params.cityId,
    );
  }
}
