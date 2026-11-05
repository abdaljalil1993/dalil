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
    return HomeFeedDto(
      categories: (json['categories'] as List<dynamic>?)
          ?.map((e) => CategoryDto.fromJson(e as Map<String, dynamic>))
          .toList(),
      cities: (json['cities'] as List<dynamic>?)
          ?.map((e) => CityDto.fromJson(e as Map<String, dynamic>))
          .toList(),
      adBanners: (json['adBanners'] as List<dynamic>?)
          ?.map((e) => AdBannerDto.fromJson(e as Map<String, dynamic>))
          .toList(),
      featured: (json['featured'] as List<dynamic>?)
          ?.map((e) => BusinessDto.fromJson(e as Map<String, dynamic>))
          .toList(),
      topRated: (json['topRated'] as List<dynamic>?)
          ?.map((e) => BusinessDto.fromJson(e as Map<String, dynamic>))
          .toList(),
      newest: (json['newest'] as List<dynamic>?)
          ?.map((e) => BusinessDto.fromJson(e as Map<String, dynamic>))
          .toList(),
      offers: (json['offers'] as List<dynamic>?)
          ?.map((e) => OfferDto.fromJson(e as Map<String, dynamic>))
          .toList(),
      onDutyPharmaciesCount: json['onDutyPharmaciesCount'] as int?,
      stats: json['stats'] != null
          ? HomeStatsDto.fromJson(json['stats'] as Map<String, dynamic>)
          : null,
    );
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
      id: json['id'] as String?,
      title: json['title'] as String?,
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
      id: json['id'] as String?,
      title: json['title'] as String?,
      description: json['description'] as String?,
      imageUrl: json['imageUrl'] as String?,
      businessId: json['businessId'] as String?,
      businessName: json['businessName'] as String?,
      validUntil: json['validUntil'] as String?,
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
    return HomeStatsDto(
      businessCount: json['businessCount'] as int?,
      reviewCount: json['reviewCount'] as int?,
      cityCount: json['cityCount'] as int?,
    );
  }
}
