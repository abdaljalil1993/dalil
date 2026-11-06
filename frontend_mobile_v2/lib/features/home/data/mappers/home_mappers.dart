import '../../../businesses/data/mappers/business_mappers.dart';
import '../../../catalog/data/mappers/catalog_mappers.dart';
import '../../domain/entities/home_feed.dart';
import '../models/home_dto.dart';

extension HomeFeedDtoMapper on HomeFeedDto {
  HomeFeed toEntity() {
    return HomeFeed(
      categories: categories?.map((e) => e.toEntity()).toList() ?? [],
      cities: cities?.map((e) => e.toEntity()).toList() ?? [],
      adBanners: adBanners?.map((e) => e.toEntity()).toList() ?? [],
      featured: featured?.map((e) => e.toEntity()).toList() ?? [],
      topRated: topRated?.map((e) => e.toEntity()).toList() ?? [],
      newest: newest?.map((e) => e.toEntity()).toList() ?? [],
      offers: offers?.map((e) => e.toEntity()).toList(),
      onDutyPharmaciesCount: onDutyPharmaciesCount,
      stats: stats?.toEntity(),
    );
  }
}

extension AdBannerDtoMapper on AdBannerDto {
  AdBanner toEntity() {
    return AdBanner(
      // Backend ads may use int ids — the DTO reads them as String? via
      // `toString()` fallback below when it couldn't cast.
      id: id ?? '',
      title: title ?? '',
      imageUrl: imageUrl,
      targetUrl: targetUrl,
      placement: placement ?? '',
    );
  }
}

extension OfferDtoMapper on OfferDto {
  Offer toEntity() {
    return Offer(
      id: id ?? '',
      title: title ?? '',
      description: description,
      imageUrl: imageUrl,
      businessId: businessId ?? '',
      businessName: businessName ?? '',
      validUntil: validUntil != null ? DateTime.tryParse(validUntil!) : null,
    );
  }
}

extension HomeStatsDtoMapper on HomeStatsDto {
  HomeStats toEntity() {
    return HomeStats(
      businessCount: businessCount ?? 0,
      reviewCount: reviewCount ?? 0,
      cityCount: cityCount ?? 0,
    );
  }
}
