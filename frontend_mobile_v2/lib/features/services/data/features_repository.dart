import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/error/result.dart';
import '../../../../core/network/api_client.dart';
import '../domain/entities/feature_switches.dart';

/// `GET /features?cityId=` — which services are ON for a governorate.
class FeaturesRepository {
  FeaturesRepository(this._api);

  final ApiClient _api;

  Future<Result<FeatureSwitches>> get({String? cityId}) async {
    final cityIdInt = cityId != null ? int.tryParse(cityId) : null;
    final res = await _api.get<Map<String, dynamic>>(
      ApiEndpoints.features,
      query: {if (cityIdInt != null) 'cityId': cityIdInt},
    );
    return res.map(FeatureSwitches.fromApi);
  }
}
