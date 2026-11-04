/// A governorate/city as returned by `GET /cities`.
class City {
  const City({
    required this.id,
    required this.name,
    this.nameEn,
    this.state,
    this.country,
    this.latitude,
    this.longitude,
    this.businessCount,
  });

  final int id;
  final String name;
  final String? nameEn;
  final String? state;
  final String? country;
  final double? latitude;
  final double? longitude;
  final int? businessCount;

  factory City.fromJson(Map<String, dynamic> json) => City(
        id: (json['id'] as num).toInt(),
        name: (json['name'] ?? '').toString(),
        nameEn: json['nameEn'] as String?,
        state: json['state'] as String?,
        country: json['country'] as String?,
        latitude: (json['latitude'] as num?)?.toDouble(),
        longitude: (json['longitude'] as num?)?.toDouble(),
        businessCount: (json['businessCount'] as num?)?.toInt(),
      );

  /// Rule #11: use `nameEn` when the locale is English and it exists.
  String localizedName(String languageCode) =>
      languageCode == 'en' && nameEn != null && nameEn!.isNotEmpty
          ? nameEn!
          : name;
}
