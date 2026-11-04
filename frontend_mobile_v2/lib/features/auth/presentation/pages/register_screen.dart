import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_theme.dart';
import '../state/auth_controller.dart';

/// Create an account (email + password path).
class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _obscure = true;

  @override
  void dispose() {
    _firstName.dispose();
    _lastName.dispose();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    FocusScope.of(context).unfocus();
    await ref.read(authControllerProvider.notifier).register(
          firstName: _firstName.text,
          lastName: _lastName.text,
          email: _email.text,
          password: _password.text,
        );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final state = ref.watch(authControllerProvider);
    final loading = state is AuthLoading;
    final error = state is AuthError ? state : null;

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
          icon: const Icon(Icons.arrow_forward_rounded),
          tooltip: 'رجوع',
        ),
        title: const Text('إنشاء حساب'),
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
                  Text(
                    'انضم إلى دليلك',
                    style: theme.textTheme.headlineSmall,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'حساب مجاني — أقل من دقيقة',
                    style: theme.textTheme.bodyMedium
                        ?.copyWith(color: theme.hintColor),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 28),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _firstName,
                          textInputAction: TextInputAction.next,
                          decoration: InputDecoration(
                            labelText: 'الاسم',
                            errorText: error?.fieldErrors['firstName'],
                          ),
                          validator: (v) => (v == null || v.trim().isEmpty)
                              ? 'الاسم مطلوب'
                              : null,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextFormField(
                          controller: _lastName,
                          textInputAction: TextInputAction.next,
                          decoration: InputDecoration(
                            labelText: 'الكنية',
                            errorText: error?.fieldErrors['lastName'],
                          ),
                          validator: (v) => (v == null || v.trim().isEmpty)
                              ? 'الكنية مطلوبة'
                              : null,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  TextFormField(
                    controller: _email,
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                    decoration: InputDecoration(
                      labelText: 'البريد الإلكتروني',
                      prefixIcon: const Icon(Icons.email_outlined),
                      errorText: error?.fieldErrors['email'],
                    ),
                    validator: (v) => (v == null || !v.contains('@'))
                        ? 'أدخل بريداً صحيحاً'
                        : null,
                  ),
                  const SizedBox(height: 14),
                  TextFormField(
                    controller: _password,
                    obscureText: _obscure,
                    textInputAction: TextInputAction.done,
                    onFieldSubmitted: (_) => _submit(),
                    decoration: InputDecoration(
                      labelText: 'كلمة المرور (8 أحرف على الأقل)',
                      prefixIcon: const Icon(Icons.lock_outline_rounded),
                      errorText: error?.fieldErrors['password'],
                      suffixIcon: IconButton(
                        onPressed: () => setState(() => _obscure = !_obscure),
                        icon: Icon(_obscure
                            ? Icons.visibility_outlined
                            : Icons.visibility_off_outlined),
                      ),
                    ),
                    validator: (v) => (v == null || v.length < 8)
                        ? '8 أحرف على الأقل'
                        : null,
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
                        : const Text('إنشاء الحساب'),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('لديك حساب بالفعل؟',
                          style: theme.textTheme.bodyMedium
                              ?.copyWith(color: theme.hintColor)),
                      TextButton(
                        onPressed: () => context.pop(),
                        child: const Text('سجّل الدخول'),
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
