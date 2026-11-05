class Category {
  final int id;
  final String slug;
  final String name;
  final String? nameEn;
  final String? icon;
  final String? color;
  final String? imageUrl;
  final int displayOrder;
  final int businessCount;
  final List<SubCategory> subCategories;

  Category({
    required this.id,
    required this.slug,
    required this.name,
    this.nameEn,
    this.icon,
    this.color,
    this.imageUrl,
    required this.displayOrder,
    required this.businessCount,
    this.subCategories = const [],
  });

  String localizedName(String locale) =>
      (locale == 'en' && nameEn != null && nameEn!.isNotEmpty) ? nameEn! : name;
}

class SubCategory {
  final int id;
  final String slug;
  final String name;
  final String? nameEn;
  final int displayOrder;
  final int businessCount;

  SubCategory({
    required this.id,
    required this.slug,
    required this.name,
    this.nameEn,
    required this.displayOrder,
    required this.businessCount,
  });

  String localizedName(String locale) =>
      (locale == 'en' && nameEn != null && nameEn!.isNotEmpty) ? nameEn! : name;
}
