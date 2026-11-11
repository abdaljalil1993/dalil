import '../../../../core/error/failures.dart';
import '../../../../core/error/result.dart';
import '../../domain/entities/business.dart';
import '../../domain/repositories/business_repository.dart';
import '../datasources/business_remote_data_source.dart';
import '../mappers/business_mappers.dart';

class BusinessRepositoryImpl implements BusinessRepository {
  final BusinessRemoteDataSource _remoteDataSource;

  BusinessRepositoryImpl(this._remoteDataSource);

  @override
  Future<Result<List<Business>>> getBusinessesByCategory({
    required int categoryId,
    int? subCategoryId,
    int? cityId,
    String? sort,
    bool openNow = false,
  }) async {
    try {
      final dtos = await _remoteDataSource.getBusinessesByCategory(
        categoryId: categoryId,
        subCategoryId: subCategoryId,
        cityId: cityId,
        sort: sort,
        openNow: openNow,
      );
      return Success(dtos.map((dto) => dto.toEntity()).toList());
    } on Failure catch (f) {
      return FailureResult(f);
    } catch (e) {
      return FailureResult(Failure(message: e.toString()));
    }
  }

  @override
  Future<Result<Business>> getBusinessBySlug(String slug) async {
    try {
      final dto = await _remoteDataSource.getBusinessBySlug(slug);
      return Success(dto.toEntity());
    } on Failure catch (f) {
      return FailureResult(f);
    } catch (e) {
      return FailureResult(Failure(message: e.toString()));
    }
  }

  @override
  Future<Result<List<Business>>> searchBusinesses({
    required String query,
    int? categoryId,
    int? cityId,
    double? lat,
    double? lng,
    int? radius,
    String? sort,
    bool openNow = false,
  }) async {
    try {
      final dtos = await _remoteDataSource.searchBusinesses(
        query: query,
        categoryId: categoryId,
        cityId: cityId,
        lat: lat,
        lng: lng,
        radius: radius,
        sort: sort,
        openNow: openNow,
      );
      return Success(dtos.map((dto) => dto.toEntity()).toList());
    } on Failure catch (f) {
      return FailureResult(f);
    } catch (e) {
      return FailureResult(Failure(message: e.toString()));
    }
  }

  @override
  Future<Result<List<Business>>> getFeaturedBusinesses(int cityId) async {
    try {
      final dtos = await _remoteDataSource.getFeaturedBusinesses(cityId);
      return Success(dtos.map((dto) => dto.toEntity()).toList());
    } on Failure catch (f) {
      return FailureResult(f);
    } catch (e) {
      return FailureResult(Failure(message: e.toString()));
    }
  }
}
