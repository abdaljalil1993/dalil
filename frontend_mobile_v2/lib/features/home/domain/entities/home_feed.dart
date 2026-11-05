import '../../../catalog/domain/entities/category.dart';
import '../../../catalog/domain/entities/city.dart';
import '../../../businesses/domain/entities/business.dart';

/// Home feed aggregate — mirrors GET /home response.
class HomeFeed {
  final List<Category> categories;
  final List<City> cities;
  final List<AdBanner> adBanners;
  final List<Business> featured;
  final List<Business> topRated;
  final List<Business> newest;
  final List<Offer>? offers;
  final int? onDutyPharmaciesCount;
  final HomeStats? stats;

  HomeFeed({
    required this.categories,
    required this.cities,
    required this.adBanners,
    required this.featured,
    required this.topRated,
    required this.newest,
    this.offers,
    this.onDutyPharmaciesCount,
    this.stats,
  });
}

class AdBanner {
  final String id;
  final String title;
  final String? imageUrl;
  final String? targetUrl;
  final String placement;

  AdBanner({
    required this.id,
    required this.title,
    this.imageUrl,
    this.targetUrl,
    required this.placement,
  });
}

class Offer {
  final String id;
  final String title;
  final String? description;
  final String? imageUrl;
  final String businessId;
  final String businessName;
  final DateTime? validUntil;

  Offer({
    required this.id,
    required this.title,
    this.description,
    this.imageUrl,
    required this.businessId,
    required this.businessName,
    this.validUntil,
  });
}

class HomeStats {
  final int businessCount;
  final int reviewCount;
  final int cityCount;

  HomeStats({
    required this.businessCount,
    required this.reviewCount,
    required this.cityCount,
  });
}
