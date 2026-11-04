import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/error/result.dart';
import '../../../../core/network/api_client.dart';
import '../domain/entities/feature_switches.dart';

/// `GET /features?cityId=` — which services are ON for a governorate.
class FeaturesRepository {
  FeaturesRepository(this._api);

  final ApiClient _api;

  Future<Result<FeatureSwitches>> get({int? cityId}) async {
    final res = await _api.get<Map<String, dynamic>>(
      ApiEndpoints.features,
      query: {if (cityId != null) 'cityId': cityId},
    );
    return res.map(FeatureSwitches.fromApi);
  }
}
