class CityDto {
  final String? id;
  final String? slug;
  final String? name;
  final String? nameEn;
  final int? businessCount;

  CityDto({
    this.id,
    this.slug,
    this.name,
    this.nameEn,
    this.businessCount,
  });

  factory CityDto.fromJson(Map<String, dynamic> json) {
    return CityDto(
      id: json['id']?.toString(), // API sends int ids
      slug: json['slug'] as String?,
      name: json['name'] as String?,
      nameEn: json['nameEn'] as String?,
      businessCount: json['businessCount'] as int? ?? 0,
    );
  }
}
