import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/di/providers.dart';
import '../../../core/prefs/prefs_providers.dart';
import '../data/features_repository.dart';
import '../domain/entities/feature_switches.dart';

/// Single source of truth for "which services are visible".
///
/// - Fetched on app start **and whenever the city changes** (rule #16).
/// - Served from cache instantly, then refreshed in the background.
/// - Screens watch this provider and hide any tile/tab whose key is `false`.
final featuresRepositoryProvider = Provider<FeaturesRepository>(
  (ref) => FeaturesRepository(ref.watch(apiClientProvider)),
);

final featuresProvider = FutureProvider<FeatureSwitches>((ref) async {
  final cityId = ref.watch(defaultCityIdProvider);
  final repo = ref.watch(featuresRepositoryProvider);
  final storage = ref.watch(localStorageProvider);

  // 1) instant paint from cache (if it belongs to this city)
  final cityIdInt = cityId != null ? int.tryParse(cityId) : null;
  final cached = storage.featuresCache(cityIdInt);
  if (cached != null) {
    // 2) …but keep the cache fresh in the background.
    ref.invalidateSelf();
    return FeatureSwitches.fromApi(cached);
  }

  final result = await repo.get(cityId: cityId);
  final switches = result.dataOrNull ?? FeatureSwitches.allOn;
  await storage.saveFeatures({'cityId': cityId, 'enabled': switches.enabled}, cityIdInt);
  return switches;
});

/// Convenience: the switches, or "everything on" while loading/erroring.
/// Use this in widgets that must never be blocked by this call.
final featuresOrDefaultProvider = Provider<FeatureSwitches>(
  (ref) => ref.watch(featuresProvider).valueOrNull ?? FeatureSwitches.allOn,
);
