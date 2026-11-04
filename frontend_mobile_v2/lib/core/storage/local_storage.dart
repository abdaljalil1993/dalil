import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

/// Non-sensitive preferences: locale, theme, default city, cached feature
/// switches, cached last home feed, onboarding flag.
class LocalStorage {
  LocalStorage(this._prefs);

  final SharedPreferences _prefs;

  static const _kLocale = 'locale';
  static const _kThemeMode = 'themeMode';
  static const _kCityId = 'cityId';
  static const _kCityName = 'cityName';
  static const _kOnboardingDone = 'onboardingDone';
  static const _kFeatures = 'features.cache';
  static const _kFeaturesCity = 'features.cityId';
  static const _kHomeFeed = 'home.feed.cache';
  static const _kLastUser = 'user.cache';

  static Future<LocalStorage> load() async =>
      LocalStorage(await SharedPreferences.getInstance());

  // locale: 'ar' | 'en'
  String get locale => _prefs.getString(_kLocale) ?? 'ar';
  Future<void> setLocale(String v) => _prefs.setString(_kLocale, v);

  // theme: 'system' | 'light' | 'dark'
  String get themeMode => _prefs.getString(_kThemeMode) ?? 'system';
  Future<void> setThemeMode(String v) => _prefs.setString(_kThemeMode, v);

  int? get cityId => _prefs.getInt(_kCityId);
  String? get cityName => _prefs.getString(_kCityName);
  Future<void> setCity({required int? id, String? name}) async {
    if (id == null) {
      await _prefs.remove(_kCityId);
      await _prefs.remove(_kCityName);
      return;
    }
    await _prefs.setInt(_kCityId, id);
    if (name != null) await _prefs.setString(_kCityName, name);
  }

  bool get onboardingDone => _prefs.getBool(_kOnboardingDone) ?? false;
  Future<void> setOnboardingDone() => _prefs.setBool(_kOnboardingDone, true);

  // ── cached feature switches (v2.1) ──
  Map<String, dynamic>? featuresCache(int? cityId) {
    final raw = _prefs.getString(_kFeatures);
    if (raw == null) return null;
    if (_prefs.getInt(_kFeaturesCity) != cityId) return null; // city changed
    try {
      return jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  Future<void> saveFeatures(Map<String, dynamic> json, int? cityId) async {
    await _prefs.setString(_kFeatures, jsonEncode(json));
    await _prefs.setInt(_kFeaturesCity, cityId ?? 0);
  }

  // ── cached last home feed (offline banner fallback) ──
  String? get homeFeedCache => _prefs.getString(_kHomeFeed);
  Future<void> saveHomeFeed(String raw) => _prefs.setString(_kHomeFeed, raw);

  // ── cached last signed-in user ──
  Map<String, dynamic>? get cachedUser {
    final raw = _prefs.getString(_kLastUser);
    if (raw == null) return null;
    try {
      return jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  Future<void> saveUser(Map<String, dynamic> user) =>
      _prefs.setString(_kLastUser, jsonEncode(user));

  Future<void> clearUser() => _prefs.remove(_kLastUser);
}
