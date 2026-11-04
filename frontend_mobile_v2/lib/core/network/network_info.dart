import 'package:connectivity_plus/connectivity_plus.dart';

/// Reports whether the device has a working connection — used for the
/// offline banner and for choosing between network and cache.
class NetworkInfo {
  NetworkInfo({Connectivity? connectivity})
      : _connectivity = connectivity ?? Connectivity();

  final Connectivity _connectivity;

  Future<bool> get isConnected async {
    final results = await _connectivity.checkConnectivity();
    return results.any((r) => r != ConnectivityResult.none);
  }

  /// Fires `true`/`false` whenever connectivity changes (for the banner).
  Stream<bool> get onStatusChange => _connectivity.onConnectivityChanged
      .map((results) => results.any((r) => r != ConnectivityResult.none));
}
