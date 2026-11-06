import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/di/providers.dart';
import '../../../core/prefs/prefs_providers.dart';
import '../data/datasources/home_remote_data_source.dart';
import '../data/repositories/home_repository_impl.dart';
import '../domain/entities/home_feed.dart';
import '../domain/repositories/home_repository.dart';

// ═══════════════════════════════════════════════════════════════════════════
// Data Sources
// ═══════════════════════════════════════════════════════════════════════════

final homeRemoteDataSourceProvider = Provider<HomeRemoteDataSource>((ref) {
  return HomeRemoteDataSource(ref.read(dioProvider));
});

// ═══════════════════════════════════════════════════════════════════════════
// Repository
// ═══════════════════════════════════════════════════════════════════════════

final homeRepositoryProvider = Provider<HomeRepository>((ref) {
  return HomeRepositoryImpl(
    ref.read(homeRemoteDataSourceProvider),
    ref.read(networkInfoProvider),
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// Home Feed
// ═══════════════════════════════════════════════════════════════════════════

final homeFeedProvider = FutureProvider.autoDispose<HomeFeed>((ref) async {
  final repository = ref.read(homeRepositoryProvider);
  final defaultCityId = ref.watch(defaultCityIdProvider);

  final result = await repository.getHomeFeed(cityId: defaultCityId);

  return result.when(
    success: (feed) => feed,
    onFailure: (failure) => throw failure,
  );
});
