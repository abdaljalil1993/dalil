import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'core/network/api_client.dart';
import 'core/network/full_api_service.dart';
import 'core/storage/token_storage.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/presentation/login_screen.dart';
import 'features/auth/presentation/register_screen.dart';
import 'features/dashboard/presentation/home_shell.dart';
import 'state/session_controller.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const DalilakMobileApp());
}

class DalilakMobileApp extends StatefulWidget {
  const DalilakMobileApp({super.key});

  @override
  State<DalilakMobileApp> createState() => _DalilakMobileAppState();
}

class _DalilakMobileAppState extends State<DalilakMobileApp> {
  late final SessionController _session;
  late final ApiClient _client;
  late final FullApiService _api;
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    _session = SessionController(TokenStorage());
    _client = ApiClient(session: _session);
    _api = FullApiService(_client);
    _router = GoRouter(
      initialLocation: '/splash',
      refreshListenable: _session,
      redirect: (context, state) {
        final location = state.matchedLocation;

        if (!_session.bootstrapped) {
          return location == '/splash' ? null : '/splash';
        }

        final isAuthRoute = location == '/login' || location == '/register';
        if (!_session.isAuthenticated) {
          return isAuthRoute ? null : '/login';
        }

        if (location == '/splash' || isAuthRoute) {
          return '/';
        }

        return null;
      },
      routes: [
        GoRoute(
          path: '/splash',
          builder: (_, __) => const _SplashScreen(),
        ),
        GoRoute(
          path: '/login',
          builder: (_, __) => const LoginScreen(),
        ),
        GoRoute(
          path: '/register',
          builder: (_, __) => const RegisterScreen(),
        ),
        GoRoute(
          path: '/',
          builder: (_, __) => const HomeShell(),
        ),
      ],
    );
    _session.bootstrap();
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: _session),
        Provider.value(value: _client),
        Provider.value(value: _api),
      ],
      child: MaterialApp.router(
        title: 'Dalilak Mobile',
        theme: AppTheme.light,
        routerConfig: _router,
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}

class _SplashScreen extends StatelessWidget {
  const _SplashScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF0E4D45), Color(0xFF103A4A), Color(0xFFF7FBFA)],
            stops: [0.0, 0.55, 1.0],
          ),
        ),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const CircularProgressIndicator(),
              const SizedBox(height: 16),
              Text('Loading Dalilak...', style: Theme.of(context).textTheme.titleLarge?.copyWith(color: Colors.white)),
            ],
          ),
        ),
      ),
    );
  }
}
