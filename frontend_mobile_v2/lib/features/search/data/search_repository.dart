import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/error/result.dart';
import '../../../../core/network/api_client.dart';
import '../domain/entities/search_suggestions.dart';
import 'models/search_suggestions_dto.dart';

/// Search-feature reads that are *not* business lists — today that is the
/// autocomplete (`GET /businesses/suggest`). The business results
/// themselves come from `BusinessRepository.searchBusinesses`.
///
/// Pass-through, no business rules → no UseCase (decision matrix §5).
class SearchRepository {
  SearchRepository(this._api);

  final ApiClient _api;

  Future<Result<SearchSuggestions>> suggestions({
    required String q,
    int? cityId,
  }) async {
    final res = await _api.get<Map<String, dynamic>>(
      ApiEndpoints.businessesSuggest,
      query: {
        'q': q,
        if (cityId != null) 'cityId': cityId,
      },
    );
    return res.map((raw) => SearchSuggestionsDto.fromJson(raw).toEntity());
  }
}
