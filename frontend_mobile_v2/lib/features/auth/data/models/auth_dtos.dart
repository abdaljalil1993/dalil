import 'user_dto.dart';

/// DTO for the `{ accessToken, refreshToken, user }` payload.
class AuthResultDto {
  const AuthResultDto({
    required this.accessToken,
    this.refreshToken,
    this.user,
  });

  factory AuthResultDto.fromJson(Map<String, dynamic> json) => AuthResultDto(
        accessToken: (json['accessToken'] ?? '').toString(),
        refreshToken: (json['refreshToken'] ?? json['refresh_token']) as String?,
        user: json['user'] is Map<String, dynamic>
            ? UserDto.fromJson(json['user'] as Map<String, dynamic>)
            : null,
      );

  final String accessToken;
  final String? refreshToken;
  final UserDto? user;
}

/// DTO for `POST /auth/otp/request`.
class OtpChallengeDto {
  const OtpChallengeDto({
    required this.phone,
    required this.expiresInSeconds,
    required this.isNewUser,
    this.devCode,
  });

  factory OtpChallengeDto.fromJson(Map<String, dynamic> json) => OtpChallengeDto(
        phone: (json['phone'] ?? '').toString(),
        expiresInSeconds: (json['expiresInSeconds'] as num?)?.toInt() ?? 60,
        isNewUser: json['isNewUser'] == true,
        devCode: json['devCode'] as String?,
      );

  final String phone;
  final int expiresInSeconds;
  final bool isNewUser;
  final String? devCode;
}
