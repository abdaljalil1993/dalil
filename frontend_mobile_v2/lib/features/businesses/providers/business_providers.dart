import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/di/providers.dart';
import '../domain/entities/business.dart';
import '../domain/repositories/business_repository.dart';
import '../data/datasources/business_remote_data_source.dart';
import '../data/repositories/business_repository_impl.dart';

// Data source provider
final businessRemoteDataSourceProvider = Provider<BusinessRemoteDataSource>((ref) {
  return BusinessRemoteDataSource(ref.watch(apiClientProvider));
});

// Repository provider
final businessRepositoryProvider = Provider<BusinessRepository>((ref) {
  return BusinessRepositoryImpl(ref.watch(businessRemoteDataSourceProvider));
});

// Businesses by category provider (with filters)
final businessesByCategoryProvider = FutureProvider.family<
    List<Business>,
    ({
      int categoryId,
      int? subCategoryId,
      int? cityId,
      bool openNow,
      String sortBy,
    })>((ref, params) async {
  final repo = ref.watch(businessRepositoryProvider);
  final result = await repo.getBusinessesByCategory(
    categoryId: params.categoryId,
    subCategoryId: params.subCategoryId,
    cityId: params.cityId,
    sort: params.sortBy,
    openNow: params.openNow,
  );

  return result.when(
    success: (businesses) => businesses,
    onFailure: (failure) => throw failure,
  );
});

// Business details provider (by slug)
final businessDetailsProvider =
    FutureProvider.family<Business, String>((ref, slug) async {
  final repo = ref.watch(businessRepositoryProvider);
  final result = await repo.getBusinessBySlug(slug);

  return result.when(
    success: (business) => business,
    onFailure: (failure) => throw failure,
  );
});

// Search businesses provider. autoDispose: a query is only alive while
// the search screen is showing it — keystrokes don't pile up in memory.
final searchBusinessesProvider = FutureProvider.autoDispose.family<
    List<Business>,
    ({
      String query,
      int? categoryId,
      int? cityId,
      double? lat,
      double? lng,
      int? radius,
      String? sort,
      bool openNow,
    })>((ref, params) async {
  final repo = ref.watch(businessRepositoryProvider);
  final result = await repo.searchBusinesses(
    query: params.query,
    categoryId: params.categoryId,
    cityId: params.cityId,
    lat: params.lat,
    lng: params.lng,
    radius: params.radius,
    sort: params.sort,
    openNow: params.openNow,
  );

  return result.when(
    success: (businesses) => businesses,
    onFailure: (failure) => throw failure,
  );
});

// Featured businesses provider
final featuredBusinessesProvider =
    FutureProvider.family<List<Business>, int>((ref, cityId) async {
  final repo = ref.watch(businessRepositoryProvider);
  final result = await repo.getFeaturedBusinesses(cityId);

  return result.when(
    success: (businesses) => businesses,
    onFailure: (failure) => throw failure,
  );
});
