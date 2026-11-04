import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/di/providers.dart';
import '../data/datasources/auth_remote_data_source.dart';
import '../data/repositories/auth_repository_impl.dart';
import '../domain/repositories/auth_repository.dart';
import '../domain/usecases/login_usecase.dart';
import '../domain/usecases/logout_usecase.dart';
import '../domain/usecases/register_usecase.dart';
import '../domain/usecases/request_otp_usecase.dart';
import '../domain/usecases/verify_otp_usecase.dart';

// ───────────────────────── data layer (DI) ─────────────────────────
final authRemoteDataSourceProvider = Provider<AuthRemoteDataSource>(
  (ref) => AuthRemoteDataSource(ref.watch(apiClientProvider)),
);

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepositoryImpl(ref.watch(authRemoteDataSourceProvider)),
);

// ───────────────────────── use cases (sensitive ops → Provider<UseCase>) ─────────────────────────
final loginUseCaseProvider =
    Provider<LoginUseCase>((ref) => LoginUseCase(ref.watch(authRepositoryProvider)));

final registerUseCaseProvider = Provider<RegisterUseCase>(
  (ref) => RegisterUseCase(ref.watch(authRepositoryProvider)),
);

final requestOtpUseCaseProvider = Provider<RequestOtpUseCase>(
  (ref) => RequestOtpUseCase(ref.watch(authRepositoryProvider)),
);

final verifyOtpUseCaseProvider = Provider<VerifyOtpUseCase>(
  (ref) => VerifyOtpUseCase(ref.watch(authRepositoryProvider)),
);

final logoutUseCaseProvider = Provider<LogoutUseCase>(
  (ref) => LogoutUseCase(ref.watch(authRepositoryProvider)),
);
