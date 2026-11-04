import '../../../../core/error/failures.dart';
import '../../../../core/error/result.dart';
import '../entities/auth_result.dart';
import '../repositories/auth_repository.dart';
import 'usecase.dart';

class RegisterParams {
  const RegisterParams({
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.password,
    this.cityId,
  });

  final String firstName;
  final String lastName;
  final String email;
  final String password;
  final int? cityId;
}

/// Creates an account. Rules:
///  - first/last name non-empty
///  - valid email
///  - password ≥ 8 characters (backend rule, checked early for better UX)
class RegisterUseCase extends UseCase<Result<AuthResult>, RegisterParams> {
  const RegisterUseCase(this._repository);

  final AuthRepository _repository;

  @override
  Future<Result<AuthResult>> call(RegisterParams params) async {
    final errors = <String, String>{};

    if (params.firstName.trim().isEmpty) {
      errors['firstName'] = 'أدخل اسمك';
    }
    if (params.lastName.trim().isEmpty) {
      errors['lastName'] = 'أدخل كنيتك';
    }
    final email = params.email.trim();
    if (email.isEmpty || !email.contains('@')) {
      errors['email'] = 'أدخل بريداً إلكترونياً صحيحاً';
    }
    if (params.password.length < 8) {
      errors['password'] = 'كلمة المرور 8 أحرف على الأقل';
    }

    if (errors.isNotEmpty) {
      return FailureResult(
        Failure(
          message: errors.values.first,
          fieldErrors: errors,
        ),
      );
    }

    return _repository.register(
      firstName: params.firstName.trim(),
      lastName: params.lastName.trim(),
      email: email,
      password: params.password,
      cityId: params.cityId,
    );
  }
}
