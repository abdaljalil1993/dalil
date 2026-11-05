import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../di/providers.dart';

/// Current app locale (ar or en).
final localeProvider = StateNotifierProvider<LocaleNotifier, Locale>((ref) {
  final storage = ref.watch(localStorageProvider);
  final initial = storage.locale ?? const Locale('ar');
  return LocaleNotifier(storage, initial);
});

class LocaleNotifier extends StateNotifier<Locale> {
  final dynamic _storage;

  LocaleNotifier(this._storage, Locale initial) : super(initial);

  Future<void> setLocale(Locale locale) async {
    state = locale;
    await _storage.saveLocale(locale);
  }
}

/// Current theme mode.
final themeModeProvider = StateNotifierProvider<ThemeModeNotifier, ThemeMode>((ref) {
  final storage = ref.watch(localStorageProvider);
  final initial = storage.themeMode ?? ThemeMode.system;
  return ThemeModeNotifier(storage, initial);
});

class ThemeModeNotifier extends StateNotifier<ThemeMode> {
  final dynamic _storage;

  ThemeModeNotifier(this._storage, ThemeMode initial) : super(initial);

  Future<void> setThemeMode(ThemeMode mode) async {
    state = mode;
    await _storage.saveThemeMode(mode);
  }
}

/// Default city ID for home feed and search.
final defaultCityIdProvider = StateNotifierProvider<DefaultCityNotifier, String?>((ref) {
  final storage = ref.watch(localStorageProvider);
  return DefaultCityNotifier(storage, storage.defaultCityId);
});

class DefaultCityNotifier extends StateNotifier<String?> {
  final dynamic _storage;

  DefaultCityNotifier(this._storage, String? initial) : super(initial);

  Future<void> setCity(String? cityId) async {
    state = cityId;
    await _storage.saveDefaultCityId(cityId);
  }
}
