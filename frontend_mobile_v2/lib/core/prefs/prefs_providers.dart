import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../di/providers.dart';

/// Locale (ar/en) — persisted, and pushed to the API as `Accept-Language`.
class LocaleNotifier extends Notifier<Locale> {
  @override
  Locale build() => Locale(ref.read(localStorageProvider).locale);

  bool get isArabic => state.languageCode == 'ar';

  Future<void> set(String code) async {
    state = Locale(code);
    await ref.read(localStorageProvider).setLocale(code);
    // Keep the `Accept-Language` header in sync without rebuilding Dio.
    ref.read(dioClientProvider).language.setLocale(code);
  }
}

/// Theme mode: system / light / dark.
class ThemeModeNotifier extends Notifier<ThemeMode> {
  @override
  ThemeMode build() => switch (ref.read(localStorageProvider).themeMode) {
        'light' => ThemeMode.light,
        'dark' => ThemeMode.dark,
        _ => ThemeMode.system,
      };

  Future<void> set(ThemeMode mode) async {
    state = mode;
    await ref.read(localStorageProvider).setThemeMode(mode.name);
  }
}

/// The city picked at onboarding (or later). `null` = all cities.
class SelectedCityNotifier extends Notifier<int?> {
  @override
  int? build() => ref.read(localStorageProvider).cityId;

  String? get name => ref.read(localStorageProvider).cityName;

  Future<void> set({required int? id, String? name}) async {
    state = id;
    await ref.read(localStorageProvider).setCity(id: id, name: name);
    // `featuresProvider` watches this provider → it refetches by itself,
    // because feature switches are per-governorate.
  }
}

final localeProvider =
    NotifierProvider<LocaleNotifier, Locale>(LocaleNotifier.new);

final themeModeProvider =
    NotifierProvider<ThemeModeNotifier, ThemeMode>(ThemeModeNotifier.new);

final selectedCityProvider =
    NotifierProvider<SelectedCityNotifier, int?>(SelectedCityNotifier.new);
