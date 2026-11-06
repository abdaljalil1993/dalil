import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/di/providers.dart';
import '../data/services_repository.dart';
import '../domain/entities/services_entities.dart';

final servicesRepositoryProvider = Provider<ServicesRepository>(
  (ref) => ServicesRepository(ref.watch(apiClientProvider)),
);

/// `GET /offers` — public read (repository directly, no UseCase).
final offersProvider = FutureProvider<List<Offer>>((ref) async {
  final result = await ref.watch(servicesRepositoryProvider).offers();
  return result.dataOrNull ?? const [];
});

/// `GET /pharmacies/on-duty` — today by default.
final onDutyPharmaciesProvider = FutureProvider<List<DutyPharmacy>>((ref) async {
  final result = await ref.watch(servicesRepositoryProvider).onDutyPharmacies();
  return result.dataOrNull ?? const [];
});

/// `GET /emergency` — nationwide + city numbers.
final emergencyProvider = FutureProvider<List<EmergencyNumber>>((ref) async {
  final result = await ref.watch(servicesRepositoryProvider).emergency();
  return result.dataOrNull ?? const [];
});