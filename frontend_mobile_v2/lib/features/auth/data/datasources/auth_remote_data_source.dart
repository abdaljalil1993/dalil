import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/error/result.dart';
import '../../../../core/network/api_client.dart';
import '../models/auth_dtos.dart';
import '../models/user_dto.dart';

/// All auth HTTP calls. Returns DTOs — never entities, never throws.
class AuthRemoteDataSource {
  AuthRemoteDataSource(this._api);

  final ApiClient _api;

  Future<Result<AuthResultDto>> login({
    required String email,
    required String password,
  }) =>
      _api.post<AuthResultDto>(
        ApiEndpoints.login,
        body: {'email': email, 'password': password},
        parse: (raw) => AuthResultDto.fromJson(raw as Map<String, dynamic>),
      );

  Future<Result<AuthResultDto>> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    int? cityId,
  }) =>
      _api.post<AuthResultDto>(
        ApiEndpoints.register,
        body: {
          'firstName': firstName,
          'lastName': lastName,
          'email': email,
          'password': password,
          if (cityId != null) 'cityId': cityId,
        },
        parse: (raw) => AuthResultDto.fromJson(raw as Map<String, dynamic>),
      );

  Future<Result<OtpChallengeDto>> requestOtp({required String phone}) => _api
          .post<OtpChallengeDto>(
        ApiEndpoints.otpRequest,
        body: {'phone': phone},
        parse: (raw) => OtpChallengeDto.fromJson(raw as Map<String, dynamic>),
      );

  Future<Result<AuthResultDto>> verifyOtp({
    required String phone,
    required String code,
    String? firstName,
    String? lastName,
    int? cityId,
  }) =>
      _api.post<AuthResultDto>(
        ApiEndpoints.otpVerify,
        body: {
          'phone': phone,
          'code': code,
          if (firstName != null && firstName.isNotEmpty) 'firstName': firstName,
          if (lastName != null && lastName.isNotEmpty) 'lastName': lastName,
          if (cityId != null) 'cityId': cityId,
        },
        parse: (raw) => AuthResultDto.fromJson(raw as Map<String, dynamic>),
      );

  Future<Result<void>> verifyPhone({
    required String phone,
    required String code,
  }) =>
      _api.post<void>(
        ApiEndpoints.otpVerifyPhone,
        body: {'phone': phone, 'code': code},
      );

  Future<Result<UserDto>> me() => _api.get<UserDto>(
        ApiEndpoints.me,
        parse: (raw) => UserDto.fromJson(raw as Map<String, dynamic>),
      );

  Future<Result<void>> logout() => _api.post<void>(ApiEndpoints.logout);

  Future<Result<void>> logoutAll() =>
      _api.post<void>(ApiEndpoints.logoutAll);

  Future<Result<void>> requestPasswordReset({required String email}) =>
      _api.post<void>(ApiEndpoints.forgotPassword, body: {'email': email});

  Future<Result<void>> resetPassword({
    required String token,
    required String newPassword,
  }) =>
      _api.post<void>(
        ApiEndpoints.resetPassword,
        body: {'token': token, 'password': newPassword},
      );
}
