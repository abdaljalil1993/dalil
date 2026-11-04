import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/app_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../state/auth_controller.dart';

/// Email + password sign-in (the OTP flow lives in [OtpLoginScreen]).
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _obscure = true;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    FocusScope.of(context).unfocus();
    await ref
        .read(authControllerProvider.notifier)
        .login(email: _email.text, password: _password.text);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final state = ref.watch(authControllerProvider);
    final loading = state is AuthLoading;
    final error = state is AuthError ? state : null;

    // Success → router redirects on its own (session changed).
    ref.listen(authControllerProvider, (prev, next) {
      if (next is AuthError && next != prev) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.message),
            backgroundColor: AppColors.error,
          ),
        );
      }
    });

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_forward_rounded), // RTL back
          tooltip: 'رجوع',
        ),
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(
                    width: 72,
                    height: 72,
                    decoration: const BoxDecoration(
                      gradient: AppColors.gradient,
                      borderRadius: BorderRadius.all(Radius.circular(24)),
                    ),
                    child: const Icon(Icons.person_rounded,
                        color: Colors.white, size: 36),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'أهلاً بعودتك',
                    style: theme.textTheme.headlineSmall,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'سجّل دخولك لمتابعة استخدام دليلك',
                    style: theme.textTheme.bodyMedium
                        ?.copyWith(color: theme.hintColor),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 28),
                  TextFormField(
                    controller: _email,
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                      decoration: InputDecoration(
                        labelText: 'البريد الإلكتروني',
                        prefixIcon: const Icon(Icons.email_outlined),
                        errorText: error?.fieldErrors['email'],
                      ),
                      validator: (v) =>
                          (v == null || !v.contains('@')) ? 'أدخل بريداً صحيحاً' : null,
                  ),
                  const SizedBox(height: 14),
                  TextFormField(
                    controller: _password,
                    obscureText: _obscure,
                    textInputAction: TextInputAction.done,
                    onFieldSubmitted: (_) => _submit(),
                    decoration: InputDecoration(
                      labelText: 'كلمة المرور',
                      prefixIcon: const Icon(Icons.lock_outline_rounded),
                      errorText: error?.fieldErrors['password'],
                      suffixIcon: IconButton(
                        onPressed: () => setState(() => _obscure = !_obscure),
                        icon: Icon(_obscure
                            ? Icons.visibility_outlined
                            : Icons.visibility_off_outlined),
                      ),
                    ),
                    validator: (v) =>
                        (v == null || v.isEmpty) ? 'أدخل كلمة المرور' : null,
                  ),
                  const SizedBox(height: 24),
                  FilledButton(
                    onPressed: loading ? null : _submit,
                    child: loading
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(
                                strokeWidth: 2.4, color: Colors.white),
                          )
                        : const Text('تسجيل الدخول'),
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    onPressed: loading ? null : () => context.push(AppRoutes.otpLogin),
                    icon: const Icon(Icons.phone_iphone_rounded),
                    label: const Text('الدخول برقم الموبايل (رمز تحقق)'),
                  ),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: () => context.push(AppRoutes.forgotPassword),
                    child: const Text('نسيت كلمة المرور؟'),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('ليس لديك حساب؟',
                          style: theme.textTheme.bodyMedium
                              ?.copyWith(color: theme.hintColor)),
                      TextButton(
                        onPressed: () => context.push(AppRoutes.register),
                        child: const Text('أنشئ حساباً'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
