import 'package:dalilak_mobile/core/error/failures.dart';
import 'package:dalilak_mobile/core/error/result.dart';
import 'package:dalilak_mobile/features/auth/domain/entities/auth_result.dart';
import 'package:dalilak_mobile/features/auth/domain/entities/user.dart';
import 'package:dalilak_mobile/features/auth/domain/repositories/auth_repository.dart';
import 'package:dalilak_mobile/features/auth/domain/usecases/login_usecase.dart';
import 'package:dalilak_mobile/features/auth/domain/usecases/logout_usecase.dart';
import 'package:dalilak_mobile/features/auth/domain/usecases/register_usecase.dart';
import 'package:dalilak_mobile/features/auth/domain/usecases/request_otp_usecase.dart';
import 'package:dalilak_mobile/features/auth/domain/usecases/verify_otp_usecase.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class _MockAuthRepository extends Mock implements AuthRepository {}

void main() {
  late _MockAuthRepository repo;

  const authResult = AuthResult(
    accessToken: 'access',
    refreshToken: 'refresh',
    user: User(id: 1, firstName: 'أبو', lastName: 'قاسم', role: 'user'),
  );

  setUp(() {
    repo = _MockAuthRepository();
    registerFallbackValue(const LoginParams(email: '', password: ''));
  });

  group('LoginUseCase', () {
    test('rejects an invalid email without touching the repository', () async {
      final result = await LoginUseCase(repo)
          .call(const LoginParams(email: 'not-an-email', password: 'x'));

      expect(result.isFailure, isTrue);
      expect(result.failureOrNull?.fieldErrors['email'], isNotNull);
      verifyNever(() => repo.login(email: any(named: 'email'), password: any(named: 'password')));
    });

    test('rejects an empty password with a field error', () async {
      final result = await LoginUseCase(repo)
          .call(const LoginParams(email: 'a@b.com', password: ''));

      expect(result.isFailure, isTrue);
      expect(result.failureOrNull?.fieldErrors['password'], isNotNull);
      verifyNever(() => repo.login(email: any(named: 'email'), password: any(named: 'password')));
    });

    test('passes valid credentials through to the repository', () async {
      when(() => repo.login(email: 'a@b.com', password: 'secret123'))
          .thenAnswer((_) async => const Success(authResult));

      final result = await LoginUseCase(repo)
          .call(const LoginParams(email: '  a@b.com ', password: 'secret123'));

      expect(result.isSuccess, isTrue);
      expect(result.dataOrNull?.accessToken, 'access');
      verify(() => repo.login(email: 'a@b.com', password: 'secret123'))
          .called(1);
    });

    test('propagates the repository failure (e.g. wrong password 401)', () async {
      when(() => repo.login(email: any(named: 'email'), password: any(named: 'password')))
          .thenAnswer((_) async => const FailureResult(
                Failure(message: 'بيانات الدخول غير صحيحة', status: 401),
              ));

      final result = await LoginUseCase(repo)
          .call(const LoginParams(email: 'a@b.com', password: 'wrong'));

      expect(result.isFailure, isTrue);
      expect(result.failureOrNull?.status, 401);
    });
  });

  group('RegisterUseCase', () {
    test('collects ALL field errors at once', () async {
      final result = await RegisterUseCase(repo).call(
        const RegisterParams(
          firstName: '',
          lastName: '',
          email: 'bad',
          password: '123',
        ),
      );

      expect(result.isFailure, isTrue);
      final fields = result.failureOrNull?.fieldErrors ?? {};
      expect(fields.keys,
          containsAll(['firstName', 'lastName', 'email', 'password']));
      verifyNever(() => repo.register(
            firstName: any(named: 'firstName'),
            lastName: any(named: 'lastName'),
            email: any(named: 'email'),
            password: any(named: 'password'),
          ));
    });

    test('accepts a valid registration', () async {
      when(() => repo.register(
            firstName: any(named: 'firstName'),
            lastName: any(named: 'lastName'),
            email: any(named: 'email'),
            password: any(named: 'password'),
            cityId: any(named: 'cityId'),
          )).thenAnswer((_) async => const Success(authResult));

      final result = await RegisterUseCase(repo).call(
        const RegisterParams(
          firstName: 'أبو',
          lastName: 'قاسم',
          email: 'a@b.com',
          password: 'secret123',
          cityId: 6,
        ),
      );

      expect(result.isSuccess, isTrue);
      verify(() => repo.register(
            firstName: 'أبو',
            lastName: 'قاسم',
            email: 'a@b.com',
            password: 'secret123',
            cityId: 6,
          )).called(1);
    });
  });

  group('RequestOtpUseCase', () {
    test('accepts 09 / 963 / +963 phone shapes', () async {
      when(() => repo.requestOtp(phone: any(named: 'phone')))
          .thenAnswer((_) async => const Success(
                OtpChallenge(
                    phone: '0912345678',
                    expiresInSeconds: 60,
                    isNewUser: false),
              ));

      for (final phone in ['0912345678', '963912345678', '+963912345678']) {
        final result =
            await RequestOtpUseCase(repo).call(RequestOtpParams(phone: phone));
        expect(result.isSuccess, isTrue, reason: phone);
      }
      verify(() => repo.requestOtp(phone: '0912345678')).called(3);
    });

    test('rejects a landline / malformed number', () async {
      final result =
          await RequestOtpUseCase(repo).call(const RequestOtpParams(phone: '12345'));
      expect(result.isFailure, isTrue);
      verifyNever(() => repo.requestOtp(phone: any(named: 'phone')));
    });
  });

  group('VerifyOtpUseCase', () {
    test('rejects a non-numeric / short code', () async {
      final result = await VerifyOtpUseCase(repo).call(
        const VerifyOtpParams(phone: '0912345678', code: 'ab'),
      );
      expect(result.isFailure, isTrue);
      verifyNever(() => repo.verifyOtp(
            phone: any(named: 'phone'),
            code: any(named: 'code'),
          ));
    });

    test('rejects a partial name when starting to fill it', () async {
      final result = await VerifyOtpUseCase(repo).call(
        const VerifyOtpParams(
          phone: '0912345678',
          code: '1234',
          firstName: 'أبو',
          lastName: '',
        ),
      );
      expect(result.isFailure, isTrue);
      expect(result.failureOrNull?.fieldErrors['lastName'], isNotNull);
    });

    test('verifies with no names (existing user)', () async {
      when(() => repo.verifyOtp(
            phone: any(named: 'phone'),
            code: any(named: 'code'),
            firstName: any(named: 'firstName'),
            lastName: any(named: 'lastName'),
            cityId: any(named: 'cityId'),
          )).thenAnswer((_) async => const Success(authResult));

      final result = await VerifyOtpUseCase(repo).call(
        const VerifyOtpParams(phone: '0912345678', code: '1234'),
      );

      expect(result.isSuccess, isTrue);
      verify(() => repo.verifyOtp(
            phone: '0912345678',
            code: '1234',
            firstName: null,
            lastName: null,
            cityId: null,
          )).called(1);
    });

    test('verifies with names (new user)', () async {
      when(() => repo.verifyOtp(
            phone: any(named: 'phone'),
            code: any(named: 'code'),
            firstName: any(named: 'firstName'),
            lastName: any(named: 'lastName'),
            cityId: any(named: 'cityId'),
          )).thenAnswer((_) async => const Success(authResult));

      final result = await VerifyOtpUseCase(repo).call(
        const VerifyOtpParams(
          phone: '0912345678',
          code: '123456',
          firstName: 'أبو',
          lastName: 'قاسم',
          cityId: 6,
        ),
      );

      expect(result.isSuccess, isTrue);
      verify(() => repo.verifyOtp(
            phone: '0912345678',
            code: '123456',
            firstName: 'أبو',
            lastName: 'قاسم',
            cityId: 6,
          )).called(1);
    });
  });

  group('LogoutUseCase', () {
    test('delegates to the repository (server-first sign out)', () async {
      when(() => repo.logout()).thenAnswer((_) async => const Success(null));

      final result = await LogoutUseCase(repo)();

      expect(result.isSuccess, isTrue);
      verify(() => repo.logout()).called(1);
    });
  });
}
