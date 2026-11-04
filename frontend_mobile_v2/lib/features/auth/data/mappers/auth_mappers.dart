import '../../domain/entities/auth_result.dart';
import '../../domain/entities/user.dart';
import '../models/auth_dtos.dart';
import '../models/user_dto.dart';

/// DTO → Entity. The only place data/ touches domain/.
extension UserMapper on UserDto {
  User toEntity() => User(
        id: id,
        firstName: firstName,
        lastName: lastName,
        email: email,
        phone: phone,
        role: role ?? 'user',
        cityId: cityId,
        avatarUrl: avatarUrl,
        isVerified: isVerified ?? false,
      );
}

extension AuthResultMapper on AuthResultDto {
  AuthResult toEntity() => AuthResult(
        accessToken: accessToken,
        refreshToken: refreshToken,
        user: (user ?? const UserDto(id: 0, firstName: '', lastName: ''))
            .toEntity(),
      );
}

extension OtpChallengeMapper on OtpChallengeDto {
  OtpChallenge toEntity() => OtpChallenge(
        phone: phone,
        expiresInSeconds: expiresInSeconds,
        isNewUser: isNewUser,
        devCode: devCode,
      );
}
