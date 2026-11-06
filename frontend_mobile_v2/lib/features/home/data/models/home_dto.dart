import '../../../businesses/data/models/business_dto.dart';
import '../../../catalog/data/models/category_dto.dart';
import '../../../catalog/data/models/city_dto.dart';

class HomeFeedDto {
  final List<CategoryDto>? categories;
  final List<CityDto>? cities;
  final List<AdBannerDto>? adBanners;
  final List<BusinessDto>? featured;
  final List<BusinessDto>? topRated;
  final List<BusinessDto>? newest;
  final List<OfferDto>? offers;
  final int? onDutyPharmaciesCount;
  final HomeStatsDto? stats;

  HomeFeedDto({
    this.categories,
    this.cities,
    this.adBanners,
    this.featured,
    this.topRated,
    this.newest,
    this.offers,
    this.onDutyPharmaciesCount,
    this.stats,
  });

  factory HomeFeedDto.fromJson(Map<String, dynamic> json) {
    // Backend returns `ads: { slider: [...], banners: [...] }` (v2.1),
    // older shape was a flat `adBanners` list — accept both.
    final ads = json['ads'];
    List<Map<String, dynamic>>? rawAds;
    if (ads is Map<String, dynamic>) {
      final slider = (ads['slider'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>();
      final banners = (ads['banners'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>();
      rawAds = [...slider, ...banners];
    } else if (json['adBanners'] is List) {
      rawAds = (json['adBanners'] as List)
          .whereType<Map<String, dynamic>>()
          .toList();
    }

    // Backend returns `onDutyPharmacies: <int>` (count) directly.
    final onDutyRaw = json['onDutyPharmaciesCount'] ??
        json['onDutyPharmacies'] ??
        (json['onDutyPharmacies'] is List
            ? (json['onDutyPharmacies'] as List).length
            : null);

    return HomeFeedDto(
      categories: _list(json['categories'], CategoryDto.fromJson),
      cities: _list(json['cities'], CityDto.fromJson),
      adBanners: rawAds?.map(AdBannerDto.fromJson).toList(),
      featured: _list(json['featured'], BusinessDto.fromJson),
      topRated: _list(json['topRated'], BusinessDto.fromJson),
      newest: _list(json['newest'], BusinessDto.fromJson),
      offers: _list(json['offers'], OfferDto.fromJson),
      onDutyPharmaciesCount: (onDutyRaw as num?)?.toInt(),
      stats: json['stats'] is Map<String, dynamic>
          ? HomeStatsDto.fromJson(json['stats'] as Map<String, dynamic>)
          : null,
    );
  }

  /// Tolerant list parser — a missing/null/mistyped key must never crash
  /// the home screen (it would show the error view instead of content).
  static List<T>? _list<T>(Object? raw, T Function(Map<String, dynamic>) from) {
    if (raw is! List) return null;
    return raw.whereType<Map<String, dynamic>>().map(from).toList();
  }
}

class AdBannerDto {
  final String? id;
  final String? title;
  final String? imageUrl;
  final String? targetUrl;
  final String? placement;

  AdBannerDto({
    this.id,
    this.title,
    this.imageUrl,
    this.targetUrl,
    this.placement,
  });

  factory AdBannerDto.fromJson(Map<String, dynamic> json) {
    return AdBannerDto(
      id: json['id']?.toString(),
      title: json['title']?.toString(),
      imageUrl: json['imageUrl'] as String?,
      targetUrl: json['targetUrl'] as String?,
      placement: json['placement'] as String?,
    );
  }
}

class OfferDto {
  final String? id;
  final String? title;
  final String? description;
  final String? imageUrl;
  final String? businessId;
  final String? businessName;
  final String? validUntil;

  OfferDto({
    this.id,
    this.title,
    this.description,
    this.imageUrl,
    this.businessId,
    this.businessName,
    this.validUntil,
  });

  factory OfferDto.fromJson(Map<String, dynamic> json) {
    return OfferDto(
      id: json['id']?.toString(),
      title: json['title']?.toString(),
      description: json['description'] as String?,
      imageUrl: json['imageUrl'] as String?,
      businessId: json['businessId']?.toString(),
      businessName: json['businessName']?.toString(),
      validUntil: json['validUntil']?.toString(),
    );
  }
}

class HomeStatsDto {
  final int? businessCount;
  final int? reviewCount;
  final int? cityCount;

  HomeStatsDto({
    this.businessCount,
    this.reviewCount,
    this.cityCount,
  });

  factory HomeStatsDto.fromJson(Map<String, dynamic> json) {
    // Backend (v2.1): { businesses, reviews, users, cities, categories }
    int? field(String k) => (json[k] as num?)?.toInt();
    return HomeStatsDto(
      businessCount: field('businessCount') ?? field('businesses'),
      reviewCount: field('reviewCount') ?? field('reviews'),
      cityCount: field('cityCount') ?? field('cities'),
    );
  }
}
