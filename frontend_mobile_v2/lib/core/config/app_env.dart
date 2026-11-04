/// Compile-time configuration.
///
/// ```bash
/// flutter run --dart-define=API_URL=http://10.0.2.2:5003/api/v1   # android emulator
/// flutter run --dart-define=API_URL=http://localhost:5003/api/v1   # ios simulator
/// ```
class AppEnv {
  AppEnv._();

  static const String apiUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://10.0.2.2:5003/api/v1',
  );

  static const String appName = 'Dalilak';

  /// Set to true to log requests/responses in debug builds.
  static const bool enableNetworkLogs = bool.fromEnvironment(
    'DEBUG_NET',
    defaultValue: false,
  );
}
