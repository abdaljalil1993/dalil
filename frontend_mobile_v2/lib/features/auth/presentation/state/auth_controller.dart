import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/di/providers.dart';
import '../../domain/entities/auth_result.dart';
import '../../domain/usecases/login_usecase.dart';
import '../../domain/usecases/register_usecase.dart';
import '../../domain/usecases/request_otp_usecase.dart';
import '../../domain/usecases/verify_otp_usecase.dart';
import '../../providers/auth_providers.dart';

/// Explicit screen states (conventions §6: loading / error / success).
sealed class AuthState {
  const AuthState();
}

class AuthInitial extends AuthState {
  const AuthInitial();
}

class AuthLoading extends AuthState {
  const AuthLoading();
}

class AuthSuccess extends AuthState {
  const AuthSuccess(this.result);
  final AuthResult result;
}

class AuthError extends AuthState {
  const AuthError(this.message, {this.fieldErrors = const {}});
  final String message;

  /// `{ field: message }` — bound to the form fields (422 rule).
  final Map<String, String> fieldErrors;
}

/// Coordinates use cases ↔ session. The notifier itself holds **no** business
/// logic — validation lives in the UseCases.
class AuthController extends Notifier<AuthState> {
  @override
  AuthState build() => const AuthInitial();

  Future<void> login({required String email, required String password}) async {
    state = const AuthLoading();
    debugPrint('[AUTH-DIAG] login() entered → calling usecase');
    final result = await ref
        .read(loginUseCaseProvider)
        .call(LoginParams(email: email, password: password));
    debugPrint('[AUTH-DIAG] usecase returned -> ${result.runtimeType}');
    result.when(
      success: _onSignedIn,
      onFailure: (f) => state = AuthError(f.message, fieldErrors: f.fieldErrors),
    );
  }

  Future<void> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
  }) async {
    state = const AuthLoading();
    final result = await ref.read(registerUseCaseProvider).call(
          RegisterParams(
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: password,
          ),
        );
    result.when(
      success: _onSignedIn,
      onFailure: (f) => state = AuthError(f.message, fieldErrors: f.fieldErrors),
    );
  }

  Future<OtpChallenge?> requestOtp(String phone) async {
    state = const AuthLoading();
    final result = await ref
        .read(requestOtpUseCaseProvider)
        .call(RequestOtpParams(phone: phone));
    return result.when(
      success: (challenge) {
        state = const AuthInitial(); // OTP entry screen takes over
        return challenge;
      },
      onFailure: (f) {
        state = AuthError(f.message, fieldErrors: f.fieldErrors);
        return null;
      },
    );
  }

  Future<void> verifyOtp({
    required String phone,
    required String code,
    String? firstName,
    String? lastName,
  }) async {
    state = const AuthLoading();
    final result = await ref.read(verifyOtpUseCaseProvider).call(
          VerifyOtpParams(
            phone: phone,
            code: code,
            firstName: firstName,
            lastName: lastName,
          ),
        );
    result.when(
      success: _onSignedIn,
      onFailure: (f) => state = AuthError(f.message, fieldErrors: f.fieldErrors),
    );
  }

  Future<void> logout() async {
    await ref.read(logoutUseCaseProvider).call();
    await ref.read(authSessionProvider).clear();
    state = const AuthInitial();
  }

  /// Persist tokens + user in the session — the router reacts by itself.
  Future<void> _onSignedIn(AuthResult auth) async {
    debugPrint('[AUTH-DIAG] _onSignedIn entry → setAuth');
    await ref.read(authSessionProvider).setAuth(
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken,
          user: {
            'id': auth.user.id,
            'firstName': auth.user.firstName,
            'lastName': auth.user.lastName,
            'email': auth.user.email,
            'phone': auth.user.phone,
            'role': auth.user.role,
            'cityId': auth.user.cityId,
            'avatarUrl': auth.user.avatarUrl,
          },
        );
    debugPrint('[AUTH-DIAG] setAuth done → AuthSuccess');
    state = AuthSuccess(auth);
  }

  void reset() => state = const AuthInitial();
}

final authControllerProvider =
    NotifierProvider<AuthController, AuthState>(AuthController.new);
