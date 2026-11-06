class CategoryDto {
  final String? id;
  final String? slug;
  final String? name;
  final String? nameEn;
  final String? icon;
  final String? color;
  final String? imageUrl;
  final int? displayOrder;
  final int? businessCount;
  final List<SubCategoryDto>? subCategories;

  CategoryDto({
    this.id,
    this.slug,
    this.name,
    this.nameEn,
    this.icon,
    this.color,
    this.imageUrl,
    this.displayOrder,
    this.businessCount,
    this.subCategories,
  });

  factory CategoryDto.fromJson(Map<String, dynamic> json) {
    return CategoryDto(
      // ids come as int from the API — normalize to String for the DTO;
      // the mapper converts back via int.tryParse.
      id: json['id']?.toString(),
      slug: json['slug'] as String?,
      name: json['name'] as String?,
      nameEn: json['nameEn'] as String?,
      icon: json['icon'] as String?,
      color: json['color'] as String?,
      imageUrl: json['imageUrl'] as String?,
      displayOrder: json['displayOrder'] as int? ?? 0,
      businessCount: json['businessCount'] as int? ?? 0,
      subCategories: (json['subCategories'] as List<dynamic>?)
          ?.map((e) => SubCategoryDto.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class SubCategoryDto {
  final String? id;
  final String? slug;
  final String? name;
  final String? nameEn;
  final int? displayOrder;
  final int? businessCount;

  SubCategoryDto({
    this.id,
    this.slug,
    this.name,
    this.nameEn,
    this.displayOrder,
    this.businessCount,
  });

  factory SubCategoryDto.fromJson(Map<String, dynamic> json) {
    return SubCategoryDto(
      id: json['id']?.toString(),
      slug: json['slug'] as String?,
      name: json['name'] as String?,
      nameEn: json['nameEn'] as String?,
      displayOrder: json['displayOrder'] as int? ?? 0,
      businessCount: json['businessCount'] as int? ?? 0,
    );
  }
}
