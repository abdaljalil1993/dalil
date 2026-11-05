import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/error/result.dart';
import '../../../../core/network/api_client.dart';
import '../domain/entities/category.dart';
import '../domain/entities/city.dart';
import '../data/models/category_dto.dart';
import '../data/models/city_dto.dart';
import '../data/mappers/catalog_mappers.dart';

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
          .map((json) => CityDto.fromJson(json).toEntity())
          .toList(),
    );
  }

  Future<Result<List<Category>>> getCategories() async {
    final res = await _api.get<List<dynamic>>(ApiEndpoints.categories);
    return res.map(
      (raw) => raw
          .whereType<Map<String, dynamic>>()
          .map((json) => CategoryDto.fromJson(json).toEntity())
          .toList(),
    );
  }

  Future<Result<Category>> getCategoryDetails(String slug) async {
    final res = await _api.get<Map<String, dynamic>>(
      '/categories/$slug',
    );
    return res.map((json) => CategoryDto.fromJson(json).toEntity());
  }
}
