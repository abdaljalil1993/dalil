import '../../../../core/error/result.dart';
import '../../domain/entities/auth_result.dart';
import '../../domain/entities/user.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_data_source.dart';
import '../mappers/auth_mappers.dart';

/// Implements the domain contract by combining the remote source and the
/// DTO→Entity mappers. Exceptions never leave this class — everything is a
/// `Result`.
class AuthRepositoryImpl implements AuthRepository {
  AuthRepositoryImpl(this._remote);

  final AuthRemoteDataSource _remote;

  @override
  Future<Result<AuthResult>> login({
    required String email,
    required String password,
  }) async {
    final res = await _remote.login(email: email, password: password);
    return res.map((dto) => dto.toEntity());
  }

  @override
  Future<Result<AuthResult>> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    int? cityId,
  }) async {
    final res = await _remote.register(
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: password,
      cityId: cityId,
    );
    return res.map((dto) => dto.toEntity());
  }

  @override
  Future<Result<OtpChallenge>> requestOtp({required String phone}) async {
    final res = await _remote.requestOtp(phone: phone);
    return res.map((dto) => dto.toEntity());
  }

  @override
  Future<Result<AuthResult>> verifyOtp({
    required String phone,
    required String code,
    String? firstName,
    String? lastName,
    int? cityId,
  }) async {
    final res = await _remote.verifyOtp(
      phone: phone,
      code: code,
      firstName: firstName,
      lastName: lastName,
      cityId: cityId,
    );
    return res.map((dto) => dto.toEntity());
  }

  @override
  Future<Result<void>> verifyPhone({
    required String phone,
    required String code,
  }) =>
      _remote.verifyPhone(phone: phone, code: code);

  @override
  Future<Result<User>> me() async {
    final res = await _remote.me();
    return res.map((dto) => dto.toEntity());
  }

  @override
  Future<Result<void>> logout() => _remote.logout();

  @override
  Future<Result<void>> logoutAll() => _remote.logoutAll();

  @override
  Future<Result<void>> requestPasswordReset({required String email}) =>
      _remote.requestPasswordReset(email: email);

  @override
  Future<Result<void>> resetPassword({
    required String token,
    required String newPassword,
  }) =>
      _remote.resetPassword(token: token, newPassword: newPassword);
}
