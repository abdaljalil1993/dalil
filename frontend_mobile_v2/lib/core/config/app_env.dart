import 'package:flutter/foundation.dart';

/// Compile-time configuration.
///
/// ```bash
/// flutter run --dart-define=API_URL=http://10.0.2.2:5003/api/v1   # android emulator
/// flutter run --dart-define=API_URL=http://localhost:5003/api/v1   # ios simulator / web
/// ```
class AppEnv {
  AppEnv._();

  static String get apiUrl {
    const envUrl = String.fromEnvironment('API_URL');
    if (envUrl.isNotEmpty) return envUrl;
    
    // Default URLs based on platform
    if (kIsWeb) {
      return 'http://localhost:5003/api/v1';
    } else {
      // For Android emulator
      return 'http://10.0.2.2:5003/api/v1';
    }
  }

  static const String appName = 'Dalilak';

  /// Set to true to log requests/responses in debug builds.
  static const bool enableNetworkLogs = bool.fromEnvironment(
    'DEBUG_NET',
    defaultValue: false,
  );
}
