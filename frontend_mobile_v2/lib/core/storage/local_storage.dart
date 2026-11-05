import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Non-sensitive preferences: locale, theme, default city, cached feature
/// switches, cached last home feed, onboarding flag.
class LocalStorage {
  LocalStorage(this._prefs);

  final SharedPreferences _prefs;

  static const _kLocale = 'locale';
  static const _kThemeMode = 'themeMode';
  static const _kDefaultCityId = 'defaultCityId';
  static const _kOnboardingDone = 'onboardingDone';
  static const _kFeatures = 'features.cache';
  static const _kFeaturesCity = 'features.cityId';
  static const _kHomeFeed = 'home.feed.cache';
  static const _kLastUser = 'user.cache';

  static Future<LocalStorage> load() async =>
      LocalStorage(await SharedPreferences.getInstance());

  // ── Locale ──
  Locale? get locale {
    final code = _prefs.getString(_kLocale);
    return code != null ? Locale(code) : null;
  }

  Future<void> saveLocale(Locale locale) =>
      _prefs.setString(_kLocale, locale.languageCode);

  // ── Theme Mode ──
  ThemeMode? get themeMode {
    final mode = _prefs.getString(_kThemeMode);
    switch (mode) {
      case 'light':
        return ThemeMode.light;
      case 'dark':
        return ThemeMode.dark;
      default:
        return ThemeMode.system;
    }
  }

  Future<void> saveThemeMode(ThemeMode mode) {
    final value = mode == ThemeMode.light
        ? 'light'
        : mode == ThemeMode.dark
            ? 'dark'
            : 'system';
    return _prefs.setString(_kThemeMode, value);
  }

  // ── Default City ──
  String? get defaultCityId => _prefs.getString(_kDefaultCityId);

  Future<void> saveDefaultCityId(String? cityId) async {
    if (cityId == null) {
      await _prefs.remove(_kDefaultCityId);
    } else {
      await _prefs.setString(_kDefaultCityId, cityId);
    }
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
