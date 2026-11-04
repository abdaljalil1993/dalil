import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_theme.dart';
import '../state/auth_controller.dart';

/// Phone → OTP code → (first/last name if new user) → signed in.
/// Implements the v2.1 OTP flow from the handoff doc.
class OtpLoginScreen extends ConsumerStatefulWidget {
  const OtpLoginScreen({super.key});

  @override
  ConsumerState<OtpLoginScreen> createState() => _OtpLoginScreenState();
}

class _OtpLoginScreenState extends ConsumerState<OtpLoginScreen> {
  final _phone = TextEditingController();
  final _code = TextEditingController();
  final _firstName = TextEditingController();
  final _lastName = TextEditingController();

  bool _codeSent = false;
  bool _isNewUser = false;
  int _resendSeconds = 0;

  @override
  void dispose() {
    _phone.dispose();
    _code.dispose();
    _firstName.dispose();
    _lastName.dispose();
    super.dispose();
  }

  Future<void> _sendCode() async {
    FocusScope.of(context).unfocus();
    final challenge = await ref
        .read(authControllerProvider.notifier)
        .requestOtp(_phone.text);
    if (!mounted) return;
    if (challenge == null) {
      _showError();
      return;
    }
    setState(() {
      _codeSent = true;
      _isNewUser = challenge.isNewUser;
      _resendSeconds = challenge.expiresInSeconds;
    });
    _tickResend();
    if (challenge.devCode != null) {
      // Dev backend without SMS — show the code to move fast.
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('رمز التحقق التجريبي: ${challenge.devCode}')),
      );
    }
  }

  void _tickResend() {
    Future.doWhile(() async {
      await Future<void>.delayed(const Duration(seconds: 1));
      if (!mounted || _resendSeconds <= 0) return false;
      setState(() => _resendSeconds--);
      return _resendSeconds > 0;
    });
  }

  Future<void> _verify() async {
    FocusScope.of(context).unfocus();
    await ref.read(authControllerProvider.notifier).verifyOtp(
          phone: _phone.text.trim(),
          code: _code.text.trim(),
          firstName: _isNewUser ? _firstName.text : null,
          lastName: _isNewUser ? _lastName.text : null,
        );
    if (!mounted) return;
    final state = ref.read(authControllerProvider);
    if (state is AuthSuccess) {
      context.pop(); // session changed → router handles the rest
    } else if (state is AuthError) {
      _showError(state.message, state.fieldErrors);
    }
  }

  void _showError([String? message, Map<String, String> fields = const {}]) {
    final state = ref.read(authControllerProvider);
    final msg = message ??
        (state is AuthError ? state.message : 'تعذّر إرسال الرمز، حاول مجدداً');
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: AppColors.error),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final state = ref.watch(authControllerProvider);
    final loading = state is AuthLoading;
    final error = state is AuthError ? state : null;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_forward_rounded),
          tooltip: 'رجوع',
        ),
        title: const Text('الدخول برقم الموبايل'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                _codeSent ? 'أدخل رمز التحقق' : 'أدخل رقم موبايلك',
                style: theme.textTheme.headlineSmall,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 6),
              Text(
                _codeSent
                    ? 'أرسلنا رصماً إلى ${_phone.text}'
                    : 'سنرسل لك رمز تحقق عبر رسالة نصية',
                style: theme.textTheme.bodyMedium
                    ?.copyWith(color: theme.hintColor),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 28),
              if (!_codeSent) ...[
                TextField(
                  controller: _phone,
                  keyboardType: TextInputType.phone,
                  textDirection: TextDirection.ltr,
                  textAlign: TextAlign.center,
                  decoration: const InputDecoration(
                    labelText: 'رقم الموبايل',
                    hintText: '09XXXXXXXX',
                    prefixIcon: Icon(Icons.phone_iphone_rounded),
                  ),
                ),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: loading ? null : _sendCode,
                  child: loading
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                              strokeWidth: 2.4, color: Colors.white),
                        )
                      : const Text('إرسال الرمز'),
                ),
              ] else ...[
                TextField(
                  controller: _code,
                  keyboardType: TextInputType.number,
                  textDirection: TextDirection.ltr,
                  textAlign: TextAlign.center,
                  maxLength: 6,
                  style: theme.textTheme.headlineMedium
                      ?.copyWith(letterSpacing: 12),
                  decoration: const InputDecoration(
                    labelText: 'رمز التحقق',
                    counterText: '',
                    prefixIcon: Icon(Icons.shield_outlined),
                  ),
                ),
                if (_isNewUser) ...[
                  const SizedBox(height: 16),
                  TextField(
                    controller: _firstName,
                    decoration: const InputDecoration(
                      labelText: 'الاسم',
                      prefixIcon: Icon(Icons.person_outline_rounded),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _lastName,
                    decoration: const InputDecoration(
                      labelText: 'الكنية',
                      prefixIcon: Icon(Icons.person_outline_rounded),
                    ),
                  ),
                ],
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: loading ? null : _verify,
                  child: loading
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                              strokeWidth: 2.4, color: Colors.white),
                        )
                      : const Text('تحقق ودخول'),
                ),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: _resendSeconds > 0 || loading ? null : _sendCode,
                  child: Text(
                    _resendSeconds > 0
                        ? 'إعادة الإرسال بعد $_resendSeconds ث'
                        : 'إعادة إرسال الرمز',
                  ),
                ),
              ],
              if (error != null && error.fieldErrors.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(
                  error.message,
                  style: theme.textTheme.bodySmall
                      ?.copyWith(color: AppColors.error),
                  textAlign: TextAlign.center,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
