import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/app_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/access_guard.dart';

/// Tab 3: text search — members only (handoff rule #1).
class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _controller = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final authed = AccessGuard.can(ref);

    return Scaffold(
      appBar: AppBar(title: const Text('بحث')),
      body: !authed
          // Guests: search is a member-only action → sign-in gate.
          ? _LoginGate(theme: theme)
          : Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                  child: TextField(
                    controller: _controller,
                    textInputAction: TextInputAction.search,
                    onSubmitted: (v) => setState(() => _query = v.trim()),
                    decoration: InputDecoration(
                      hintText: 'ابحث عن نشاط، خدمة، تصنيفاً...',
                      prefixIcon: const Icon(Icons.search_rounded),
                      suffixIcon: _query.isNotEmpty
                          ? IconButton(
                              onPressed: () {
                                _controller.clear();
                                setState(() => _query = '');
                              },
                              icon: const Icon(Icons.clear_rounded),
                            )
                          : null,
                    ),
                  ),
                ),
                Expanded(
                  child: _query.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 76,
                                height: 76,
                                decoration: BoxDecoration(
                                  gradient: AppColors.gradient,
                                  borderRadius: BorderRadius.circular(24),
                                ),
                                child: const Icon(Icons.search_rounded,
                                    color: Colors.white, size: 36),
                              ),
                              const SizedBox(height: 16),
                              Text('اكتب للبحث في الأنشطة',
                                  style: theme.textTheme.bodyLarge
                                      ?.copyWith(color: theme.hintColor)),
                            ],
                          ),
                        )
                      : const _SearchResults(),
                ),
              ],
            ),
    );
  }
}

class _SearchResults extends ConsumerWidget {
  const _SearchResults();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return const Center(child: Text('نتائج البحث — قريباً'));
  }
}

class _LoginGate extends StatelessWidget {
  const _LoginGate({required this.theme});

  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 76,
              height: 76,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.search_rounded,
                  color: AppColors.primary, size: 36),
            ),
            const SizedBox(height: 18),
            Text('البحث للمسجّلين فقط',
                style: theme.textTheme.titleLarge,
                textAlign: TextAlign.center),
            const SizedBox(height: 8),
            Text(
              'سجّل دخولك للبحث في كل الأنشطة والخدمات في مدينتك.',
              style: theme.textTheme.bodyMedium?.copyWith(color: theme.hintColor),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: () => context.push(AppRoutes.login),
              child: const Text('سجّل الدخول'),
            ),
            const SizedBox(height: 10),
            OutlinedButton(
              onPressed: () => context.push(AppRoutes.register),
              child: const Text('أنشئ حساباً'),
            ),
          ],
        ),
      ),
    );
  }
}