import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../features/auth/providers/auth_providers.dart';

/// Step 1 of password recovery: send a reset link to the email.
/// (The backend mails a token; opening it returns to a reset screen later.)
class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() =>
      _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _email = TextEditingController();
  bool _loading = false;
  bool _sent = false;

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final email = _email.text.trim();
    if (!email.contains('@')) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('أدخل بريداً إلكترونياً صحيحاً'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }
    setState(() => _loading = true);
    final result = await ref
        .read(authRepositoryProvider)
        .requestPasswordReset(email: email);
    if (!mounted) return;
    setState(() {
      _loading = false;
      _sent = result.isSuccess;
    });
    if (result.isFailure) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result.failureOrNull?.message ?? 'حدث خطأ'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_forward_rounded),
          tooltip: 'رجوع',
        ),
        title: const Text('استعادة كلمة المرور'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: _sent
              ? Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 32),
                    Container(
                      width: 84,
                      height: 84,
                      decoration: BoxDecoration(
                        color: AppColors.success.withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.mark_email_read_rounded,
                          color: AppColors.success, size: 42),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      'تحقق من بريدك',
                      style: theme.textTheme.headlineSmall,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'أرسلنا رابط استعادة كلمة المرور إلى ${_email.text.trim()}\n'
                      'الرابط صالح لمدة محدودة.',
                      style: theme.textTheme.bodyMedium
                          ?.copyWith(color: theme.hintColor),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 28),
                    FilledButton(
                      onPressed: () => context.pop(),
                      child: const Text('العودة لتسجيل الدخول'),
                    ),
                  ],
                )
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 16),
                    Text(
                      'نسيت كلمة المرور؟',
                      style: theme.textTheme.headlineSmall,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'أدخل بريدك وسنرسل لك رابط الاستعادة.',
                      style: theme.textTheme.bodyMedium
                          ?.copyWith(color: theme.hintColor),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 28),
                    TextField(
                      controller: _email,
                      keyboardType: TextInputType.emailAddress,
                      textInputAction: TextInputAction.done,
                      onSubmitted: (_) => _submit(),
                      decoration: const InputDecoration(
                        labelText: 'البريد الإلكتروني',
                        prefixIcon: Icon(Icons.email_outlined),
                      ),
                    ),
                    const SizedBox(height: 24),
                    FilledButton(
                      onPressed: _loading ? null : _submit,
                      child: _loading
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2.4, color: Colors.white),
                            )
                          : const Text('إرسال رابط الاستعادة'),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}
