import '../../../../core/error/result.dart';
import '../entities/home_feed.dart';

abstract class HomeRepository {
  /// Fetch the home feed for the selected city.
  /// Returns all sections: categories, cities, ads, featured, top rated, newest, offers, stats.
  Future<Result<HomeFeed>> getHomeFeed({String? cityId});
}
