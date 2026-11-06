import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../di/providers.dart';
import '../network/dio_client.dart';
import '../storage/local_storage.dart';

/// Current app locale (ar or en).
final localeProvider = StateNotifierProvider<LocaleNotifier, Locale>((ref) {
  final storage = ref.watch(localStorageProvider);
  final initial = storage.locale ?? const Locale('ar');
  return LocaleNotifier(storage, initial, ref.read(dioClientProvider));
});

class LocaleNotifier extends StateNotifier<Locale> {
  final LocalStorage _storage;
  final DioClient _dioClient;

  LocaleNotifier(this._storage, Locale initial, this._dioClient)
      : super(initial);

  Future<void> setLocale(Locale locale) async {
    state = locale;
    await _storage.saveLocale(locale);
    // Keep `Accept-Language` in sync with the UI (rule #11) — the API
    // returns `nameEn` only when it receives `Accept-Language: en`.
    _dioClient.language.setLocale(locale.languageCode);
  }
}

/// Current theme mode.
final themeModeProvider = StateNotifierProvider<ThemeModeNotifier, ThemeMode>((ref) {
  final storage = ref.watch(localStorageProvider);
  final initial = storage.themeMode ?? ThemeMode.system;
  return ThemeModeNotifier(storage, initial);
});

class ThemeModeNotifier extends StateNotifier<ThemeMode> {
  final LocalStorage _storage;

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
  final LocalStorage _storage;

  DefaultCityNotifier(this._storage, String? initial) : super(initial);

  Future<void> setCity(String? cityId) async {
    state = cityId;
    await _storage.saveDefaultCityId(cityId);
  }
}
