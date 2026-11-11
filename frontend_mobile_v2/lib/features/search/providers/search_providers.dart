import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/di/providers.dart';
import '../data/search_repository.dart';
import '../domain/entities/search_suggestions.dart';

final searchRepositoryProvider = Provider<SearchRepository>(
  (ref) => SearchRepository(ref.watch(apiClientProvider)),
);

/// Autocomplete for the debounced query — `autoDispose` so keystrokes that
/// are no longer on screen don't linger in memory.
///
/// The screen only watches this with a query it has already debounced
/// (≥ 2 chars), so one request per pause, not per keystroke.
final suggestionsProvider = FutureProvider.autoDispose
    .family<SearchSuggestions, ({String q, int? cityId})>((ref, params) async {
  final result = await ref.watch(searchRepositoryProvider)
      .suggestions(q: params.q, cityId: params.cityId);

  return result.when(
    success: (suggestions) => suggestions,
    onFailure: (failure) => throw failure, // keeps the typed Failure
  );
});
