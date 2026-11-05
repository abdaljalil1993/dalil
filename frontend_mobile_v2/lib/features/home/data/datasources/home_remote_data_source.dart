import 'package:dio/dio.dart';

import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_envelope.dart';
import '../models/home_dto.dart';

class HomeRemoteDataSource {
  final Dio _dio;

  HomeRemoteDataSource(this._dio);

  Future<HomeFeedDto> getHomeFeed({String? cityId}) async {
    final response = await _dio.get(
      ApiEndpoints.home,
      queryParameters: cityId != null ? {'cityId': cityId} : null,
    );

    final envelope = ApiEnvelope.fromJson(response.data);
    if (!envelope.success || envelope.data == null) {
      throw Exception(envelope.message ?? 'Failed to load home feed');
    }

    return HomeFeedDto.fromJson(envelope.data!);
  }
}
