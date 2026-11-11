/// Which bucket the autocomplete entry came from — it decides both the
/// icon and what a tap does (open business / open category / re-search).
enum SuggestionKind { business, category, subCategory }

/// One autocomplete row. Deliberately tiny: the API returns slim records
/// for suggestions (no full [Business]/[Category] payload), and the UI
/// needs only a label, a target and optional visual hints.
class SearchSuggestion {
  const SearchSuggestion({
    required this.name,
    required this.slug,
    required this.kind,
    this.icon,
    this.color,
  });

  final String name;
  final String slug;

  final SuggestionKind kind;

  /// Category icon name (backend field) — null for businesses.
  final String? icon;

  /// Category hex color, e.g. `#5B3DF5` — null for businesses.
  final String? color;
}

/// Flattened autocomplete payload of `GET /businesses/suggest`:
/// businesses first, then categories, then sub-categories — the order the
/// backend ranks them in.
class SearchSuggestions {
  const SearchSuggestions({required this.items});

  final List<SearchSuggestion> items;

  bool get isEmpty => items.isEmpty;
  bool get isNotEmpty => items.isNotEmpty;

  static const empty = SearchSuggestions(items: []);
}
