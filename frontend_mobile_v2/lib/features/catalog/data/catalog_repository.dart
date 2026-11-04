import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/error/result.dart';
import '../../../../core/network/api_client.dart';
import '../domain/entities/city.dart';

/// Pass-through catalog reads — no business rules, so no UseCase
/// (decision matrix §12.7.1).
class CatalogRepository {
  CatalogRepository(this._api);

  final ApiClient _api;

  Future<Result<List<City>>> cities() async {
    final res = await _api.get<List<dynamic>>(ApiEndpoints.cities);
    return res.map(
      (raw) => raw
          .whereType<Map<String, dynamic>>()
          .map(City.fromJson)
          .toList(),
    );
  }
}
