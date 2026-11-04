import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/di/providers.dart';
import '../data/catalog_repository.dart';
import '../domain/entities/city.dart';

final catalogRepositoryProvider = Provider<CatalogRepository>(
  (ref) => CatalogRepository(ref.watch(apiClientProvider)),
);

/// All cities — used by onboarding (city picker) and filters.
final citiesProvider = FutureProvider<List<City>>(
  (ref) async {
    final result = await ref.watch(catalogRepositoryProvider).cities();
    return result.dataOrNull ?? const [];
  },
);
