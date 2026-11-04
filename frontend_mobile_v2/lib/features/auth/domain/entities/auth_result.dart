import 'user.dart';

/// What a successful sign-in / OTP-verify returns.
class AuthResult {
  const AuthResult({
    required this.accessToken,
    this.refreshToken,
    required this.user,
  });

  final String accessToken;
  final String? refreshToken;
  final User user;
}

/// `POST /auth/otp/request` — OTP sent, waiting for the code.
class OtpChallenge {
  const OtpChallenge({
    required this.phone,
    required this.expiresInSeconds,
    required this.isNewUser,
    this.devCode,
  });

  final String phone;
  final int expiresInSeconds;

  /// `true` → the API expects `firstName` + `lastName` on verify (rule: v2.1).
  final bool isNewUser;

  /// Debug builds only, when the backend is not wired to a real SMS provider.
  final String? devCode;
}
