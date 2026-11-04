import '../../../../core/error/result.dart';
import '../repositories/auth_repository.dart';
import 'usecase.dart';

/// Signs out on the server, then the caller clears the local session.
/// (Order matters: server first, so a failed logout doesn't leave a
/// dangling valid refresh token.)
class LogoutUseCase extends UseCaseNoParams<Result<void>> {
  const LogoutUseCase(this._repository);

  final AuthRepository _repository;

  @override
  Future<Result<void>> call() => _repository.logout();
}
