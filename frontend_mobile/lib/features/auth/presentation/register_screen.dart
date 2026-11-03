import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/network/full_api_service.dart';
import '../../../state/session_controller.dart';
import '../../../widgets/gradient_scaffold.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _firstCtrl = TextEditingController(text: 'John');
  final _lastCtrl = TextEditingController(text: 'Doe');
  final _emailCtrl = TextEditingController(text: 'john@example.com');
  final _passwordCtrl = TextEditingController(text: 'StrongPassword123!');

  bool _loading = false;

  @override
  void dispose() {
    _firstCtrl.dispose();
    _lastCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _loading = true);
    final api = context.read<FullApiService>();
    final session = context.read<SessionController>();

    try {
      final res = await api.register(
        firstName: _firstCtrl.text.trim(),
        lastName: _lastCtrl.text.trim(),
        email: _emailCtrl.text.trim(),
        password: _passwordCtrl.text,
      );

      final data = (res.data as Map<String, dynamic>)['data'] as Map<String, dynamic>?;
      final access = data?['accessToken']?.toString();
      final refresh = data?['refreshToken']?.toString();
      final user = data?['user'] as Map<String, dynamic>?;

      if (access != null && access.isNotEmpty) {
        await session.setAuth(token: access, refresh: refresh, userPayload: user);
      }

      if (!mounted) return;
      context.go('/');
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Registration failed: $e')));
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
          Text('Create Account', style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          Text('Register and start using the mobile control panel.', style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 24),
          TextField(controller: _firstCtrl, decoration: const InputDecoration(labelText: 'First name')),
          const SizedBox(height: 12),
          TextField(controller: _lastCtrl, decoration: const InputDecoration(labelText: 'Last name')),
          const SizedBox(height: 12),
          TextField(controller: _emailCtrl, decoration: const InputDecoration(labelText: 'Email')),
          const SizedBox(height: 12),
          TextField(controller: _passwordCtrl, obscureText: true, decoration: const InputDecoration(labelText: 'Password')),
          const SizedBox(height: 18),
          FilledButton(onPressed: _loading ? null : _submit, child: Text(_loading ? 'Creating...' : 'Register')),
          const SizedBox(height: 10),
          TextButton(onPressed: () => context.pop(), child: const Text('Back to login')),
        ],
      ),
    );
  }
}
