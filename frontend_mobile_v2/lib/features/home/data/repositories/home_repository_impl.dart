import '../../../../core/error/exceptions.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/error/result.dart';
import '../../../../core/network/network_info.dart';
import '../../domain/entities/home_feed.dart';
import '../../domain/repositories/home_repository.dart';
import '../datasources/home_remote_data_source.dart';
import '../mappers/home_mappers.dart';

class HomeRepositoryImpl implements HomeRepository {
  final HomeRemoteDataSource _remoteDataSource;
  final NetworkInfo _networkInfo;

  HomeRepositoryImpl(this._remoteDataSource, this._networkInfo);

  @override
  Future<Result<HomeFeed>> getHomeFeed({String? cityId}) async {
    if (!await _networkInfo.isConnected) {
      return FailureResult(Failure(message: 'لا يوجد اتصال بالإنترنت'));
    }

    try {
      final dto = await _remoteDataSource.getHomeFeed(cityId: cityId);
      return Success(dto.toEntity());
    } on ServerException catch (e) {
      return FailureResult(Failure(message: e.message));
    } catch (e) {
      return FailureResult(Failure(message: 'حدث خطأ غير متوقع'));
    }
  }
}
