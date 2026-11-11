import 'dart:convert';

import 'package:dalilak_mobile/features/search/data/models/search_suggestions_dto.dart';
import 'package:dalilak_mobile/features/search/domain/entities/search_suggestions.dart';
import 'package:flutter_test/flutter_test.dart';

/// Mirrors the exact payload of `GET /businesses/suggest` (the `data`
/// field of the envelope) as `BusinessService.suggest` builds it — so a
/// change on the backend surfaces here with the real shape instead of a
/// blank suggestion row in the UI.
void main() {
  const body = '''
  {
    "businesses": [
      {"id": "b1", "name": "صيدلية الشفاء", "slug": "al-shifa-pharmacy",
       "logoImage": null, "averageRating": 4.5, "city": "دمشق", "category": "صيدليات"},
      {"id": "b2", "name": "  ", "slug": "nameless"}
    ],
    "categories": [
      {"id": 5, "name": "مقاهي", "slug": "cafes", "icon": "coffee", "color": "#5B3DF5"}
    ],
    "subCategories": [
      {"id": 12, "name": "أسنان", "slug": "dentist",
       "categoryId": 2, "categorySlug": "doctors"}
    ]
  }''';

  test('flattens the three groups in backend order and keeps kinds', () {
    final dto = SearchSuggestionsDto.fromJson(
      jsonDecode(body) as Map<String, dynamic>,
    );
    final items = dto.toEntity().items;

    // The blank-named business is dropped; the rest keep their order.
    expect(items, hasLength(3));

    expect(items[0].kind, SuggestionKind.business);
    expect(items[0].name, 'صيدلية الشفاء');
    expect(items[0].slug, 'al-shifa-pharmacy');

    expect(items[1].kind, SuggestionKind.category);
    expect(items[1].slug, 'cafes');
    expect(items[1].icon, 'coffee');
    expect(items[1].color, '#5B3DF5');

    expect(items[2].kind, SuggestionKind.subCategory);
    expect(items[2].name, 'أسنان');
  });

  test('missing/null groups parse to an empty result, never a crash', () {
    final empty = SearchSuggestionsDto.fromJson(const {}).toEntity();
    expect(empty.isEmpty, isTrue);
    expect(SearchSuggestions.empty.isEmpty, isTrue);

    final nulls = SearchSuggestionsDto.fromJson(const {
      'businesses': null,
      'categories': 'not-a-list',
      'subCategories': [42], // wrong element type → ignored
    }).toEntity();
    expect(nulls.isEmpty, isTrue);
  });
}
