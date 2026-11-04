import '../../../../core/error/result.dart';
import '../entities/auth_result.dart';
import '../entities/user.dart';

/// Contract for everything auth. Data layer implements it; domain and
/// presentation depend only on this interface (dependency rule).
abstract class AuthRepository {
  Future<Result<AuthResult>> login({
    required String email,
    required String password,
  });

  Future<Result<AuthResult>> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    int? cityId,
  });

  Future<Result<OtpChallenge>> requestOtp({required String phone});

  /// `isNewUser` requires [firstName] + [lastName] (v2.1 rule).
  Future<Result<AuthResult>> verifyOtp({
    required String phone,
    required String code,
    String? firstName,
    String? lastName,
    int? cityId,
  });

  /// Change phone while signed in (`POST /auth/otp/verify-phone`).
  Future<Result<void>> verifyPhone({
    required String phone,
    required String code,
  });

  Future<Result<User>> me();

  Future<Result<void>> logout();
  Future<Result<void>> logoutAll();

  Future<Result<void>> requestPasswordReset({required String email});
  Future<Result<void>> resetPassword({
    required String token,
    required String newPassword,
  });
}
