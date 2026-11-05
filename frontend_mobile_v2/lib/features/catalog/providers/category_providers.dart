import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../domain/entities/category.dart';
import '../data/catalog_repository.dart';
import '../../../core/di/providers.dart';

// Repository provider
final categoryRepositoryProvider = Provider<CatalogRepository>((ref) {
  return CatalogRepository(ref.watch(apiClientProvider));
});

// All categories provider
final categoriesProvider = FutureProvider<List<Category>>((ref) async {
  final repo = ref.watch(categoryRepositoryProvider);
  final result = await repo.getCategories();
  
  return result.when(
    success: (categories) => categories,
    onFailure: (failure) => throw Exception(failure.message),
  );
});

// Category details provider (by slug)
final categoryDetailsProvider =
    FutureProvider.family<Category, String>((ref, slug) async {
  final repo = ref.watch(categoryRepositoryProvider);
  final result = await repo.getCategoryDetails(slug);
  
  return result.when(
    success: (category) => category,
    onFailure: (failure) => throw Exception(failure.message),
  );
});

// Selected category ID state (for filtering businesses)
final selectedCategoryIdProvider = StateProvider<int?>((ref) => null);
final selectedSubCategoryIdProvider = StateProvider<int?>((ref) => null);
