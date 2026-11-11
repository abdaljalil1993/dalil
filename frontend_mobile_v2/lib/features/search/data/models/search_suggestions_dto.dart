import '../../domain/entities/search_suggestions.dart';

/// Shape returned by `GET /businesses/suggest`:
/// `{businesses: [...], categories: [...], subCategories: [...]}`.
class SearchSuggestionsDto {
  const SearchSuggestionsDto({
    required this.businesses,
    required this.categories,
    required this.subCategories,
  });

  factory SearchSuggestionsDto.fromJson(Map<String, dynamic> json) =>
      SearchSuggestionsDto(
        businesses: _maps(json['businesses']),
        categories: _maps(json['categories']),
        subCategories: _maps(json['subCategories']),
      );

  final List<Map<String, dynamic>> businesses;
  final List<Map<String, dynamic>> categories;
  final List<Map<String, dynamic>> subCategories;

  /// Defensive: a missing/null group is an empty group, never a crash.
  static List<Map<String, dynamic>> _maps(Object? value) => value is List
      ? value.whereType<Map<String, dynamic>>().toList()
      : const [];

  SearchSuggestions toEntity() {
    String label(Object? raw) => (raw ?? '').toString().trim();

    return SearchSuggestions(items: [
      for (final b in businesses)
        if (label(b['name']).isNotEmpty && label(b['slug']).isNotEmpty)
          SearchSuggestion(
            name: label(b['name']),
            slug: label(b['slug']),
            kind: SuggestionKind.business,
          ),
      for (final c in categories)
        if (label(c['name']).isNotEmpty && label(c['slug']).isNotEmpty)
          SearchSuggestion(
            name: label(c['name']),
            slug: label(c['slug']),
            kind: SuggestionKind.category,
            icon: label(c['icon']).isEmpty ? null : label(c['icon']),
            color: label(c['color']).isEmpty ? null : label(c['color']),
          ),
      for (final s in subCategories)
        if (label(s['name']).isNotEmpty && label(s['slug']).isNotEmpty)
          SearchSuggestion(
            name: label(s['name']),
            slug: label(s['slug']),
            kind: SuggestionKind.subCategory,
          ),
    ]);
  }
}
