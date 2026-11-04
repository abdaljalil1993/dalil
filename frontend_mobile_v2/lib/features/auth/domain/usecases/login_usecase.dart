import '../../../../core/error/failures.dart';
import '../../../../core/error/result.dart';
import '../entities/auth_result.dart';
import '../repositories/auth_repository.dart';
import 'usecase.dart';

class LoginParams {
  const LoginParams({required this.email, required this.password});
  final String email;
  final String password;
}

/// Email + password sign-in.
///
/// Business rules enforced here (not in the widget):
///  - email must be non-empty and contain `@`
///  - password must be non-empty
class LoginUseCase extends UseCase<Result<AuthResult>, LoginParams> {
  const LoginUseCase(this._repository);

  final AuthRepository _repository;

  @override
  Future<Result<AuthResult>> call(LoginParams params) async {
    final email = params.email.trim();
    final password = params.password;

    if (email.isEmpty || !email.contains('@')) {
      return const FailureResult(
        Failure(message: 'أدخل بريداً إلكترونياً صحيحاً', fieldErrors: {
          'email': 'أدخل بريداً إلكترونياً صحيحاً',
        }),
      );
    }
    if (password.isEmpty) {
      return const FailureResult(
        Failure(message: 'أدخل كلمة المرور', fieldErrors: {
          'password': 'أدخل كلمة المرور',
        }),
      );
    }
    return _repository.login(email: email, password: password);
  }
}
