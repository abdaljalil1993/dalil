import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/pages/forgot_password_screen.dart';
import '../../features/businesses/presentation/pages/business_details_screen.dart';
import '../../features/auth/presentation/pages/login_screen.dart';
import '../../features/auth/presentation/pages/otp_login_screen.dart';
import '../../features/auth/presentation/pages/register_screen.dart';
import '../../features/catalog/presentation/pages/categories_screen.dart';
import '../../features/catalog/presentation/pages/category_details_screen.dart';
import '../../features/home/presentation/pages/home_screen.dart';
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
  // Read (never watch): recreating the router on auth changes would reset
  // `initialLocation` and swallow cold-start deep links. `refreshListenable`
  // re-runs redirects instead.
  final session = ref.read(authSessionProvider);

  return GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: AppRoutes.splash,
    refreshListenable: session,
    debugLogDiagnostics: false,
    routes: [
      // Bare URL (no hash) → splash → home.
      GoRoute(
        path: '/',
        redirect: (context, state) => AppRoutes.splash,
      ),
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
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: AppRoutes.categories,
        builder: (context, state) => const CategoriesScreen(),
      ),
      GoRoute(
        path: '/categories/:slug',
        builder: (context, state) {
          final slug = state.pathParameters['slug']!;
          return CategoryDetailsScreen(slug: slug);
        },
      ),
      // Deep link for categories (e.g. /c/restaurants)
      GoRoute(
        path: '/c/:slug',
        redirect: (context, state) => '/categories/${state.pathParameters['slug']}',
      ),
      // Business details (deep links from ads: /b/:slug)
      GoRoute(
        path: '/businesses/:slug',
        builder: (context, state) =>
            BusinessDetailsScreen(slug: state.pathParameters['slug']!),
      ),
      GoRoute(
        path: '/b/:slug',
        redirect: (context, state) =>
            '/businesses/${state.pathParameters['slug']}',
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

/// Helper for widgets that need to know if a feature is visible.
bool isFeatureOn(WidgetRef ref, String key) =>
    ref.read(featuresOrDefaultProvider).on(key);
