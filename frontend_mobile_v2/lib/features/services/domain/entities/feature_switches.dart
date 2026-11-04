/// Feature switches returned by `GET /features?cityId=` (v2.1).
///
/// A switch that is `false` means: hide its button, screen and tab entirely.
/// Never show a disabled service and let the server reject it later.
class FeatureSwitches {
  const FeatureSwitches({required this.enabled, this.cityId});

  /// `null` means "all governorates" / unknown key → treated as ON.
  final Map<String, bool> enabled;
  final int? cityId;

  static const keys = <String>{
    // directory core
    'search', 'reviews', 'favorites', 'addBusiness', 'claims', 'reports',
    'otpLogin', 'register',
    // services
    'offers', 'pharmacies', 'emergency', 'menu', 'bookings', 'serviceRequests',
    'realEstate', 'cars', 'jobs',
    // monetization & content
    'ads', 'featured', 'promote', 'subscriptions',
  };

  factory FeatureSwitches.fromApi(Map<String, dynamic> json) {
    final raw = json['enabled'];
    final map = <String, bool>{};
    if (raw is Map) {
      raw.forEach((k, v) => map['$k'] = v == true);
    }
    final cityId = json['cityId'];
    return FeatureSwitches(
      enabled: map,
      cityId: cityId is num ? cityId.toInt() : null,
    );
  }

  /// Unknown key → ON (a future backend addition shouldn't blank our UI).
  bool on(String key) => enabled[key] ?? true;

  // convenience accessors used across screens
  bool get search => on('search');
  bool get reviews => on('reviews');
  bool get favorites => on('favorites');
  bool get addBusiness => on('addBusiness');
  bool get claims => on('claims');
  bool get reports => on('reports');
  bool get otpLogin => on('otpLogin');
  bool get register => on('register');
  bool get offers => on('offers');
  bool get pharmacies => on('pharmacies');
  bool get emergency => on('emergency');
  bool get menu => on('menu');
  bool get bookings => on('bookings');
  bool get serviceRequests => on('serviceRequests');
  bool get realEstate => on('realEstate');
  bool get cars => on('cars');
  bool get jobs => on('jobs');
  bool get ads => on('ads');
  bool get featured => on('featured');
  bool get promote => on('promote');
  bool get subscriptions => on('subscriptions');

  /// Used when there is no network and no cache: everything visible.
  static const allOn = FeatureSwitches(enabled: {});

  @override
  String toString() => 'FeatureSwitches(cityId: $cityId, $enabled)';
}
