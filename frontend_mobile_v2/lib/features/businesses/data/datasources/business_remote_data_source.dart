import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../models/business_dto.dart';

class BusinessRemoteDataSource {
  final ApiClient _api;

  BusinessRemoteDataSource(this._api);

  /// UI sort labels → API contract values (backend rejects unknown sorts
  /// with 422). Single translation point for every call site.
  static const _sortToApi = <String, String>{
    'recommended': 'relevance',
  };

  static String? _apiSort(String? sort) =>
      sort == null ? null : (_sortToApi[sort] ?? sort);

  Future<List<BusinessDto>> getBusinessesByCategory({
    required int categoryId,
    int? subCategoryId,
    int? cityId,
    String? sort,
    bool openNow = false,
  }) async {
    final queryParams = <String, dynamic>{
      'categoryId': categoryId,
      if (subCategoryId != null) 'subCategoryId': subCategoryId,
      if (cityId != null) 'cityId': cityId,
      if (_apiSort(sort) != null) 'sort': _apiSort(sort),
      if (openNow) 'openNow': 'true',
    };

    final result = await _api.get<List<dynamic>>(
      ApiEndpoints.businesses,
      query: queryParams,
    );

    return result.when(
      success: (data) => data
          .whereType<Map<String, dynamic>>()
          .map((json) => BusinessDto.fromJson(json))
          .toList(),
      onFailure: (failure) => throw failure, // keep the typed Failure
    );
  }

  Future<BusinessDto> getBusinessBySlug(String slug) async {
    final result = await _api.get<Map<String, dynamic>>(
      '/businesses/$slug',
    );

    return result.when(
      success: (data) => BusinessDto.fromJson(data),
      onFailure: (failure) => throw failure, // keep the typed Failure
    );
  }

  Future<List<BusinessDto>> searchBusinesses({
    required String query,
    int? categoryId,
    int? cityId,
    double? lat,
    double? lng,
    int? radius,
    String? sort,
    bool openNow = false,
  }) async {
    final queryParams = <String, dynamic>{
      'q': query,
      if (openNow) 'openNow': 'true',
      if (categoryId != null) 'categoryId': categoryId,
      if (cityId != null) 'cityId': cityId,
      if (lat != null) 'lat': lat,
      if (lng != null) 'lng': lng,
      if (radius != null) 'radius': radius,
      if (_apiSort(sort) != null) 'sort': _apiSort(sort),
    };

    final result = await _api.get<List<dynamic>>(
      ApiEndpoints.businessesSearch,
      query: queryParams,
    );

    return result.when(
      success: (data) => data
          .whereType<Map<String, dynamic>>()
          .map((json) => BusinessDto.fromJson(json))
          .toList(),
      onFailure: (failure) => throw failure, // keep the typed Failure
    );
  }

  Future<List<BusinessDto>> getFeaturedBusinesses(int cityId) async {
    final result = await _api.get<List<dynamic>>(
      ApiEndpoints.featured,
      query: {'cityId': cityId},
    );

    return result.when(
      success: (data) => data
          .whereType<Map<String, dynamic>>()
          .map((json) => BusinessDto.fromJson(json))
          .toList(),
      onFailure: (failure) => throw failure, // keep the typed Failure
    );
  }
}
