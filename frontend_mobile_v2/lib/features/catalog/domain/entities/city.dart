class City {
  final String id;
  final String slug;
  final String name;
  final String? nameEn;
  final int businessCount;

  City({
    required this.id,
    required this.slug,
    required this.name,
    this.nameEn,
    required this.businessCount,
  });

  String localizedName(String locale) =>
      (locale == 'en' && nameEn != null && nameEn!.isNotEmpty) ? nameEn! : name;
}
