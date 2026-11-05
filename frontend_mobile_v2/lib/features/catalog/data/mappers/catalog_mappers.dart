import '../../domain/entities/category.dart';
import '../../domain/entities/city.dart';
import '../models/category_dto.dart';
import '../models/city_dto.dart';

extension CategoryDtoMapper on CategoryDto {
  Category toEntity() {
    return Category(
      id: int.tryParse(id ?? '0') ?? 0,
      slug: slug ?? '',
      name: name ?? '',
      nameEn: nameEn,
      icon: icon,
      color: color,
      imageUrl: imageUrl,
      displayOrder: displayOrder ?? 0,
      businessCount: businessCount ?? 0,
      subCategories: subCategories?.map((e) => e.toEntity()).toList() ?? [],
    );
  }
}

extension SubCategoryDtoMapper on SubCategoryDto {
  SubCategory toEntity() {
    return SubCategory(
      id: int.tryParse(id ?? '0') ?? 0,
      slug: slug ?? '',
      name: name ?? '',
      nameEn: nameEn,
      displayOrder: displayOrder ?? 0,
      businessCount: businessCount ?? 0,
    );
  }
}

extension CityDtoMapper on CityDto {
  City toEntity() {
    return City(
      id: id ?? '',
      slug: slug ?? '',
      name: name ?? '',
      nameEn: nameEn,
      businessCount: businessCount ?? 0,
    );
  }
}
