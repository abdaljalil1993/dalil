import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/network/full_api_service.dart';
import '../../../state/session_controller.dart';
import '../../../widgets/gradient_scaffold.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailCtrl = TextEditingController(text: 'john@example.com');
  final _passwordCtrl = TextEditingController(text: 'StrongPassword123!');
  bool _loading = false;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _loading = true);
    final api = context.read<FullApiService>();
    final session = context.read<SessionController>();

    try {
      final res = await api.login(email: _emailCtrl.text.trim(), password: _passwordCtrl.text);
      final data = (res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>?;
      final access = data?['accessToken']?.toString();
      final refresh = data?['refreshToken']?.toString();
      final user = data?['user'] as Map<String, dynamic>?;

      if (access == null || access.isEmpty) throw Exception('Invalid login payload');

      await session.setAuth(token: access, refresh: refresh, userPayload: user);
      if (!mounted) return;
      context.go('/');
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Login failed: $e')));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return GradientScaffold(
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const SizedBox(height: 24),
          Text('Welcome Back', style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          Text('Sign in to access Dalilak mobile console.', style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 24),
          TextField(controller: _emailCtrl, decoration: const InputDecoration(labelText: 'Email')),
          const SizedBox(height: 12),
          TextField(controller: _passwordCtrl, obscureText: true, decoration: const InputDecoration(labelText: 'Password')),
          const SizedBox(height: 18),
          FilledButton(onPressed: _loading ? null : _submit, child: Text(_loading ? 'Signing in...' : 'Login')),
          const SizedBox(height: 10),
          TextButton(onPressed: () => context.push('/register'), child: const Text('Create an account')),
        ],
      ),
    );
  }
}
