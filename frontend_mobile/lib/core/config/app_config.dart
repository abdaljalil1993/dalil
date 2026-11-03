import 'dart:io';

import 'package:flutter/foundation.dart';

class AppConfig {
  static const String _apiOverride = String.fromEnvironment('API_BASE_URL', defaultValue: '');
  static const String _healthOverride = String.fromEnvironment('HEALTH_BASE_URL', defaultValue: '');

  static String get apiBaseUrl {
    if (_apiOverride.isNotEmpty) return _apiOverride;
    if (kIsWeb) return 'http://localhost:5003/api/v1';
    if (Platform.isAndroid) return 'http://10.0.2.2:5003/api/v1';
    return 'http://localhost:5003/api/v1';
  }

  static String get healthBaseUrl {
    if (_healthOverride.isNotEmpty) return _healthOverride;
    if (kIsWeb) return 'http://localhost:5000';
    if (Platform.isAndroid) return 'http://10.0.2.2:5000';
    return 'http://localhost:5000';
  }
}
