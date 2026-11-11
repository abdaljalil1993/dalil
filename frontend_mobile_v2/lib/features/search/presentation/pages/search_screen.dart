import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/error/failures.dart';
import '../../../../core/l10n/app_localizations.dart';
import '../../../../core/prefs/prefs_providers.dart';
import '../../../../core/router/app_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/category_icons.dart';
import '../../../../core/widgets/access_guard.dart';
import '../../../../core/widgets/dalilak_app_bar.dart';
import '../../../../core/widgets/reveal_list.dart';
import '../../../../core/widgets/skeletons.dart';
import '../../../../core/widgets/status_views.dart';
import '../../../businesses/businesses.dart';
import '../../domain/entities/search_suggestions.dart';
import '../../providers/search_providers.dart';

/// Tab: text search — members only (handoff rule #1).
///
/// Flow: type → 350ms pause → debounced `_query` drives *both* the
/// autocomplete chips and the results list (one request per pause, not per
/// keystroke). Submitting immediately (keyboard action) skips the wait.
class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _controller = TextEditingController();
  Timer? _debounce;

  String _query = '';
  String _sort = 'relevance';
  bool _openNow = false;

  static const _pause = Duration(milliseconds: 350);

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    super.dispose();
  }

  /// Clear button reacts instantly; the network query waits for a pause.
  void _onChanged(String value) {
    _debounce?.cancel();
    setState(() {});
    final text = value.trim();
    if (text.isEmpty) {
      setState(() => _query = '');
      return;
    }
    _debounce = Timer(_pause, () {
      if (mounted) setState(() => _query = text);
    });
  }

  /// Enter key (or a tapped suggestion) searches without waiting.
  void _searchNow(String value) {
    _debounce?.cancel();
    setState(() => _query = value.trim());
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final authed = AccessGuard.can(ref);
    // Scoped to the saved city when one is chosen (handoff: `search?cityId=`).
    final cityId = int.tryParse(ref.watch(defaultCityIdProvider) ?? '');

    return Scaffold(
      appBar: const DalilakAppBar(title: Text('بحث')),
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
                    onChanged: _onChanged,
                    onSubmitted: _searchNow,
                    decoration: InputDecoration(
                      hintText: 'ابحث عن نشاط، خدمة، تصنيفاً...',
                      prefixIcon: const Icon(Icons.search_rounded),
                      suffixIcon: _controller.text.isNotEmpty
                          ? IconButton(
                              onPressed: () {
                                _controller.clear();
                                _searchNow('');
                              },
                              tooltip: 'مسح',
                              icon: const Icon(Icons.clear_rounded),
                            )
                          : null,
                    ),
                  ),
                ),
                if (_query.isNotEmpty) ...[
                  _FilterRow(
                    sort: _sort,
                    openNow: _openNow,
                    onSortChanged: (v) => setState(() => _sort = v),
                    onOpenNowChanged: (v) => setState(() => _openNow = v),
                  ),
                  _SuggestionChips(
                    query: _query,
                    cityId: cityId,
                    onPick: _searchNow,
                  ),
                ],
                Expanded(
                  child: _query.isEmpty
                      ? _IdleHint(theme: theme)
                      : _SearchResults(
                          query: _query,
                          cityId: cityId,
                          sort: _sort,
                          openNow: _openNow,
                        ),
                ),
              ],
            ),
    );
  }
}

// ───────────────────────────── results ─────────────────────────────

class _SearchResults extends ConsumerWidget {
  const _SearchResults({
    required this.query,
    required this.cityId,
    required this.sort,
    required this.openNow,
  });

  final String query;
  final int? cityId;
  final String sort;
  final bool openNow;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final params = (
      query: query,
      categoryId: null,
      cityId: cityId,
      lat: null,
      lng: null,
      radius: null,
      sort: sort,
      openNow: openNow,
    );
    final async = ref.watch(searchBusinessesProvider(params));

    return async.when(
      loading: () => const ListSkeleton(itemCount: 6, itemHeight: 120),
      error: (error, stack) => ErrorView(
        // Failure carries the API's own message — show it clean.
        message: error is Failure ? error.message : 'تعذّر إجراء البحث',
        onRetry: () => ref.invalidate(searchBusinessesProvider(params)),
      ),
      data: (businesses) {
        if (businesses.isEmpty) {
          return EmptyView(
            message: 'لا توجد نتائج لـ «$query»',
            icon: Icons.search_off_rounded,
          );
        }
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 4, 20, 4),
              child: Text(
                '${businesses.length} ${l10n.results}',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Theme.of(context).colorScheme.outline,
                    ),
              ),
            ),
            Expanded(
              child: RevealList(
                padding: const EdgeInsets.fromLTRB(20, 4, 20, 20),
                itemCount: businesses.length,
                itemBuilder: (context, index) =>
                    BusinessCard(business: businesses[index]),
              ),
            ),
          ],
        );
      },
    );
  }
}

// ───────────────────────────── autocomplete ─────────────────────────────

class _SuggestionChips extends ConsumerWidget {
  const _SuggestionChips({
    required this.query,
    required this.cityId,
    required this.onPick,
  });

  final String query;
  final int? cityId;
  final ValueChanged<String> onPick;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (query.length < 2) return const SizedBox.shrink();

    final async = ref.watch(suggestionsProvider((q: query, cityId: cityId)));

    return async.maybeWhen(
      data: (suggestions) {
        if (suggestions.isEmpty) return const SizedBox.shrink();
        return Padding(
          padding: const EdgeInsets.fromLTRB(20, 4, 20, 8),
          child: Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final item in suggestions.items)
                _SuggestionChip(item: item, onPick: onPick),
            ],
          ),
        );
      },
      // Suggest is an enhancement, never a blocker: any failure/absence
      // simply shows no chips while results keep working.
      orElse: () => const SizedBox.shrink(),
    );
  }
}

class _SuggestionChip extends StatelessWidget {
  const _SuggestionChip({required this.item, required this.onPick});

  final SearchSuggestion item;
  final ValueChanged<String> onPick;

  @override
  Widget build(BuildContext context) {
    final color = parseHexColor(item.color) ?? AppColors.primary;
    final isCategory = item.kind != SuggestionKind.business;

    return ActionChip(
      avatar: Icon(
        isCategory ? categoryIcon(item.icon) : Icons.storefront_outlined,
        size: 16,
        color: color,
      ),
      label: Text(item.name),
      backgroundColor: color.withValues(alpha: 0.08),
      onPressed: () {
        switch (item.kind) {
          case SuggestionKind.business:
            context.push('/businesses/${item.slug}');
          case SuggestionKind.category:
            context.push('/categories/${item.slug}');
          case SuggestionKind.subCategory:
            // No dedicated screen: treat it as a plain search term.
            onPick(item.name);
        }
      },
    );
  }
}

// ───────────────────────────── filters ─────────────────────────────

class _FilterRow extends StatelessWidget {
  const _FilterRow({
    required this.sort,
    required this.openNow,
    required this.onSortChanged,
    required this.onOpenNowChanged,
  });

  final String sort;
  final bool openNow;
  final ValueChanged<String> onSortChanged;
  final ValueChanged<bool> onOpenNowChanged;

  static const List<(String, String)> _sorts = [
    ('relevance', 'الأكثر صلة'),
    ('rating', 'الأعلى تقييماً'),
    ('newest', 'الأحدث'),
  ];

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    // Chips instead of a popup menu: every option is visible at once and
    // there is no hidden-state to explain in a directory this small.
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 4),
      child: Wrap(
        spacing: 8,
        runSpacing: 4,
        children: [
          for (final (value, label) in _sorts)
            ChoiceChip(
              label: Text(label),
              selected: sort == value,
              onSelected: (_) => onSortChanged(value),
              selectedColor: AppColors.primary.withValues(alpha: 0.14),
            ),
          FilterChip(
            label: const Text('مفتوح الآن'),
            selected: openNow,
            onSelected: onOpenNowChanged,
            avatar: Icon(
              Icons.access_time,
              size: 18,
              color: openNow ? scheme.onSecondaryContainer : null,
            ),
          ),
        ],
      ),
    );
  }
}

// ───────────────────────────── idle ─────────────────────────────

class _IdleHint extends StatelessWidget {
  const _IdleHint({required this.theme});

  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Center(
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
            child: const Icon(Icons.search_rounded, color: Colors.white, size: 36),
          ),
          const SizedBox(height: 16),
          Text('اكتب للبحث في الأنشطة',
              style: theme.textTheme.bodyLarge?.copyWith(color: theme.hintColor)),
          const SizedBox(height: 6),
          Text('جرّب: صيدلية · مقاهي · طبيب أسنان',
              style: theme.textTheme.bodySmall?.copyWith(color: theme.hintColor)),
        ],
      ),
    );
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
