import '../../../catalog/data/models/category_dto.dart';
import '../../../catalog/data/models/city_dto.dart';

class BusinessDto {
  final String? id;
  final String? slug;
  final String? name;
  final String? nameEn;
  final String? description;
  final CategoryDto? category;
  final SubCategoryDto? subCategory;
  final CityDto? city;
  final String? district;
  final String? address;
  final String? phone;
  final String? whatsapp;
  final String? website;
  final double? latitude;
  final double? longitude;
  final double? averageRating;
  final int? reviewCount;
  final String? coverImage;
  final String? logoImage;
  final bool? isFeatured;
  final bool? isVerified;
  final bool? isActive;
  final bool? isOpenNow;
  final String? status;
  final List<String>? amenities;
  final Map<String, dynamic>? attributes;
  final String? priceLevel;
  final String? createdAt;
  final String? updatedAt;

  BusinessDto({
    this.id,
    this.slug,
    this.name,
    this.nameEn,
    this.description,
    this.category,
    this.subCategory,
    this.city,
    this.district,
    this.address,
    this.phone,
    this.whatsapp,
    this.website,
    this.latitude,
    this.longitude,
    this.averageRating,
    this.reviewCount,
    this.coverImage,
    this.logoImage,
    this.isFeatured,
    this.isVerified,
    this.isActive,
    this.isOpenNow,
    this.status,
    this.amenities,
    this.attributes,
    this.priceLevel,
    this.createdAt,
    this.updatedAt,
  });

  factory BusinessDto.fromJson(Map<String, dynamic> json) {
    return BusinessDto(
      id: json['id'] as String?,
      slug: json['slug'] as String?,
      name: json['name'] as String?,
      nameEn: json['nameEn'] as String?,
      description: json['description'] as String?,
      category: json['category'] != null
          ? CategoryDto.fromJson(json['category'] as Map<String, dynamic>)
          : null,
      subCategory: json['subCategory'] != null
          ? SubCategoryDto.fromJson(json['subCategory'] as Map<String, dynamic>)
          : null,
      city: json['city'] != null
          ? CityDto.fromJson(json['city'] as Map<String, dynamic>)
          : null,
      district: json['district'] as String?,
      address: json['address'] as String?,
      phone: json['phone'] as String?,
      whatsapp: json['whatsapp'] as String?,
      website: json['website'] as String?,
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      averageRating: (json['averageRating'] as num?)?.toDouble() ?? 0.0,
      reviewCount: json['reviewCount'] as int? ?? 0,
      coverImage: json['coverImage'] as String?,
      logoImage: json['logoImage'] as String?,
      isFeatured: json['isFeatured'] as bool? ?? false,
      isVerified: json['isVerified'] as bool? ?? false,
      isActive: json['isActive'] as bool? ?? true,
      isOpenNow: json['isOpenNow'] as bool?,
      status: json['status'] as String? ?? 'approved',
      amenities: (json['amenities'] as List<dynamic>?)?.cast<String>(),
      attributes: json['attributes'] as Map<String, dynamic>?,
      priceLevel: json['priceLevel'] as String?,
      createdAt: json['createdAt'] as String?,
      updatedAt: json['updatedAt'] as String?,
    );
  }
}
