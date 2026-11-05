import '../../../catalog/domain/entities/category.dart';
import '../../../catalog/domain/entities/city.dart';

class Business {
  final String id;
  final String slug;
  final String name;
  final String? nameEn;
  final String? description;
  final Category category;
  final SubCategory? subCategory;
  final City city;
  final String? district;
  final String? address;
  final String? phone;
  final String? whatsapp;
  final String? website;
  final double? latitude;
  final double? longitude;
  final double averageRating;
  final int reviewCount;
  final String? coverImage;
  final String? logoImage;
  final bool isFeatured;
  final bool isVerified;
  final bool isActive;
  final bool? isOpenNow;
  final String status;
  final List<String> amenities;
  final Map<String, dynamic>? attributes;
  final PriceLevel? priceLevel;
  final DateTime createdAt;
  final DateTime? updatedAt;

  Business({
    required this.id,
    required this.slug,
    required this.name,
    this.nameEn,
    this.description,
    required this.category,
    this.subCategory,
    required this.city,
    this.district,
    this.address,
    this.phone,
    this.whatsapp,
    this.website,
    this.latitude,
    this.longitude,
    required this.averageRating,
    required this.reviewCount,
    this.coverImage,
    this.logoImage,
    required this.isFeatured,
    required this.isVerified,
    required this.isActive,
    this.isOpenNow,
    required this.status,
    this.amenities = const [],
    this.attributes,
    this.priceLevel,
    required this.createdAt,
    this.updatedAt,
  });

  String localizedName(String locale) =>
      (locale == 'en' && nameEn != null && nameEn!.isNotEmpty) ? nameEn! : name;
}

enum PriceLevel {
  cheap,
  moderate,
  expensive,
  veryExpensive,
}

extension PriceLevelExt on PriceLevel {
  String get symbol {
    switch (this) {
      case PriceLevel.cheap:
        return '\$';
      case PriceLevel.moderate:
        return '\$\$';
      case PriceLevel.expensive:
        return '\$\$\$';
      case PriceLevel.veryExpensive:
        return '\$\$\$\$';
    }
  }
}
