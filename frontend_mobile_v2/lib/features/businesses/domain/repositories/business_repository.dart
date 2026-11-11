import '../../../../core/error/result.dart';
import '../entities/business.dart';

abstract class BusinessRepository {
  Future<Result<List<Business>>> getBusinessesByCategory({
    required int categoryId,
    int? subCategoryId,
    int? cityId,
    String? sort,
    bool openNow = false,
  });

  Future<Result<Business>> getBusinessBySlug(String slug);

  Future<Result<List<Business>>> searchBusinesses({
    required String query,
    int? categoryId,
    int? cityId,
    double? lat,
    double? lng,
    int? radius,
    String? sort,
    bool openNow = false,
  });

  Future<Result<List<Business>>> getFeaturedBusinesses(int cityId);
}
