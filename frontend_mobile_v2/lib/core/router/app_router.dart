import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/pages/forgot_password_screen.dart';
import '../../features/auth/presentation/pages/login_screen.dart';
import '../../features/auth/presentation/pages/otp_login_screen.dart';
import '../../features/auth/presentation/pages/register_screen.dart';
import '../../features/home/presentation/home_placeholder.dart';
import '../../features/services/providers/features_providers.dart';
import '../../features/splash/presentation/splash_screen.dart';
import '../di/providers.dart';

/// Route table — kept flat and explicit so deep links (`/b/:slug`, `/c/:slug`)
/// are trivial to verify.
class AppRoutes {
  AppRoutes._();

  static const splash = '/splash';
  static const onboarding = '/onboarding';
  static const login = '/login';
  static const register = '/register';
  static const otpLogin = '/login/otp';
  static const forgotPassword = '/forgot-password';
  static const home = '/home';
  static const categories = '/categories';
  static const search = '/search';
  static const favorites = '/favorites';
  static const account = '/account';
  static const notifications = '/notifications';

  /// Deep links opened from ads / shared links.
  static String business(String slug) => '/b/$slug';
  static String category(String slug) => '/c/$slug';
}

final rootNavigatorKey = GlobalKey<NavigatorState>();

final appRouterProvider = Provider<GoRouter>((ref) {
  // Rebuild redirects when auth state changes (sign in / out).
  final session = ref.watch(authSessionProvider);

  return GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: AppRoutes.splash,
    debugLogDiagnostics: false,
    routes: [
      GoRoute(
        path: AppRoutes.splash,
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: AppRoutes.login,
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: AppRoutes.register,
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: AppRoutes.otpLogin,
        builder: (context, state) => const OtpLoginScreen(),
      ),
      GoRoute(
        path: AppRoutes.forgotPassword,
        builder: (context, state) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: AppRoutes.home,
        builder: (context, state) => const HomePlaceholder(),
      ),
    ],
    redirect: (context, state) {
      if (!session.bootstrapped) return null;

      final location = state.matchedLocation;

      // Splash is only a bootstrap screen — hand over to the shell.
      if (location == AppRoutes.splash) return AppRoutes.home;

      return null;
    },
  );
});

/// Notifies the router that auth state changed (sign in / out).
final routerRefreshProvider = Provider<void>((ref) => ref.watch(authSessionProvider));

/// Helper for widgets that need to know if a feature is visible.
bool isFeatureOn(WidgetRef ref, String key) =>
    ref.read(featuresOrDefaultProvider).on(key);
