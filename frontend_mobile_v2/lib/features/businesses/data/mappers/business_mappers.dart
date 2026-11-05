import '../../../catalog/data/mappers/catalog_mappers.dart';
import '../../domain/entities/business.dart';
import '../models/business_dto.dart';

extension BusinessDtoMapper on BusinessDto {
  Business toEntity() {
    return Business(
      id: id ?? '',
      slug: slug ?? '',
      name: name ?? '',
      nameEn: nameEn,
      description: description,
      category: category!.toEntity(),
      subCategory: subCategory?.toEntity(),
      city: city!.toEntity(),
      district: district,
      address: address,
      phone: phone,
      whatsapp: whatsapp,
      website: website,
      latitude: latitude,
      longitude: longitude,
      averageRating: averageRating ?? 0.0,
      reviewCount: reviewCount ?? 0,
      coverImage: coverImage,
      logoImage: logoImage,
      isFeatured: isFeatured ?? false,
      isVerified: isVerified ?? false,
      isActive: isActive ?? true,
      isOpenNow: isOpenNow,
      status: status ?? 'approved',
      amenities: amenities ?? [],
      attributes: attributes,
      priceLevel: _parsePriceLevel(priceLevel),
      createdAt: DateTime.tryParse(createdAt ?? '') ?? DateTime.now(),
      updatedAt: updatedAt != null ? DateTime.tryParse(updatedAt!) : null,
    );
  }

  static PriceLevel? _parsePriceLevel(String? value) {
    switch (value) {
      case 'cheap':
        return PriceLevel.cheap;
      case 'moderate':
        return PriceLevel.moderate;
      case 'expensive':
        return PriceLevel.expensive;
      case 'very_expensive':
        return PriceLevel.veryExpensive;
      default:
        return null;
    }
  }
}
