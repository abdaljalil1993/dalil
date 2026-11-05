import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../models/business_dto.dart';

class BusinessRemoteDataSource {
  final ApiClient _api;

  BusinessRemoteDataSource(this._api);

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
      if (sort != null) 'sort': sort,
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
      onFailure: (failure) => throw Exception(failure.message),
    );
  }

  Future<BusinessDto> getBusinessBySlug(String slug) async {
    final result = await _api.get<Map<String, dynamic>>(
      '/businesses/$slug',
    );

    return result.when(
      success: (data) => BusinessDto.fromJson(data),
      onFailure: (failure) => throw Exception(failure.message),
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
  }) async {
    final queryParams = <String, dynamic>{
      'q': query,
      if (categoryId != null) 'categoryId': categoryId,
      if (cityId != null) 'cityId': cityId,
      if (lat != null) 'lat': lat,
      if (lng != null) 'lng': lng,
      if (radius != null) 'radius': radius,
      if (sort != null) 'sort': sort,
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
      onFailure: (failure) => throw Exception(failure.message),
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
      onFailure: (failure) => throw Exception(failure.message),
    );
  }
}
