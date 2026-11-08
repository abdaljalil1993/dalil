import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/account/presentation/pages/account_screen.dart';
import '../../features/auth/presentation/pages/forgot_password_screen.dart';
import '../../features/businesses/presentation/pages/business_details_screen.dart';
import '../../features/auth/presentation/pages/login_screen.dart';
import '../../features/auth/presentation/pages/otp_login_screen.dart';
import '../../features/auth/presentation/pages/register_screen.dart';
import '../../features/catalog/presentation/pages/categories_screen.dart';
import '../../features/catalog/presentation/pages/category_details_screen.dart';
import '../../features/home/presentation/pages/home_screen.dart';
import '../../features/search/presentation/pages/search_screen.dart';
import '../../features/services/presentation/pages/emergency_screen.dart';
import '../../features/services/presentation/pages/offers_screen.dart';
import '../../features/services/presentation/pages/pharmacies_screen.dart';
import '../../features/services/providers/features_providers.dart';
import '../../features/splash/presentation/splash_screen.dart';
import '../di/providers.dart';
import 'app_transitions.dart';
import '../widgets/app_shell.dart';

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

  // v2.1 quick services
  static const offers = '/offers';
  static const pharmacies = '/pharmacies';
  static const emergency = '/emergency';

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
      goAppRoute(
        path: AppRoutes.splash,
        builder: (context, state) => const SplashScreen(),
      ),
      goAppRoute(
        path: AppRoutes.login,
        builder: (context, state) => const LoginScreen(),
      ),
      goAppRoute(
        path: AppRoutes.register,
        builder: (context, state) => const RegisterScreen(),
      ),
      goAppRoute(
        path: AppRoutes.otpLogin,
        builder: (context, state) => const OtpLoginScreen(),
      ),
      goAppRoute(
        path: AppRoutes.forgotPassword,
        builder: (context, state) => const ForgotPasswordScreen(),
      ),

      // ── Main shell: 4 tabs with a bottom NavigationBar ──
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) =>
            AppShell(navigationShell: navigationShell),
        branches: [
          // 0 · الرئيسية (+ شاشات الخدمات السريعة)
          StatefulShellBranch(routes: [
            goAppRoute(
              path: AppRoutes.home,
              builder: (context, state) => const HomeScreen(),
            ),
            goAppRoute(
              path: AppRoutes.offers,
              builder: (context, state) => const OffersScreen(),
            ),
            goAppRoute(
              path: AppRoutes.pharmacies,
              builder: (context, state) => const PharmaciesScreen(),
            ),
            goAppRoute(
              path: AppRoutes.emergency,
              builder: (context, state) => const EmergencyScreen(),
            ),
          ]),
          // 1 · التصنيفات (+ تفاصيلها ورابط العميق /c/:slug)
          StatefulShellBranch(routes: [
            goAppRoute(
              path: AppRoutes.categories,
              builder: (context, state) => const CategoriesScreen(),
            ),
            goAppRoute(
              path: '/categories/:slug',
              builder: (context, state) =>
                  CategoryDetailsScreen(slug: state.pathParameters['slug']!),
            ),
            GoRoute(
              path: '/c/:slug',
              redirect: (context, state) =>
                  '/categories/${state.pathParameters['slug']}',
            ),
          ]),
          // 2 · بحث
          StatefulShellBranch(routes: [
            goAppRoute(
              path: AppRoutes.search,
              builder: (context, state) => const SearchScreen(),
            ),
          ]),
          // 3 · حسابي
          StatefulShellBranch(routes: [
            goAppRoute(
              path: AppRoutes.account,
              builder: (context, state) => const AccountScreen(),
            ),
          ]),
        ],
      ),

      // ── Full-screen pages (root navigator → cover the shell) ──
      goAppRoute(
        path: '/businesses/:slug',
        parentNavigatorKey: rootNavigatorKey,
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
