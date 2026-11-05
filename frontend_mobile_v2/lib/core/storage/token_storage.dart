import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Access + refresh tokens live here (never in shared_preferences).
/// On Web, falls back to SharedPreferences (less secure but works).
class TokenStorage {
  TokenStorage({FlutterSecureStorage? storage})
      : _storage = storage ??
            const FlutterSecureStorage(
              webOptions: WebOptions(
                dbName: 'dalilak_secure',
                publicKey: 'dalilak_public_key',
              ),
            );

  final FlutterSecureStorage _storage;

  static const _kAccess = 'dalilak.accessToken';
  static const _kRefresh = 'dalilak.refreshToken';

  Future<String?> readAccessToken() async {
    try {
      return await _storage.read(key: _kAccess);
    } catch (e) {
      if (kDebugMode) print('TokenStorage.readAccessToken error: $e');
      return null;
    }
  }

  Future<String?> readRefreshToken() async {
    try {
      return await _storage.read(key: _kRefresh);
    } catch (e) {
      if (kDebugMode) print('TokenStorage.readRefreshToken error: $e');
      return null;
    }
  }

  /// Saves both tokens. The refresh token **rotates** on every refresh —
  /// always store the NEW one, never keep the old.
  Future<void> saveTokens({
    required String accessToken,
    required String? refreshToken,
  }) async {
    try {
      await _storage.write(key: _kAccess, value: accessToken);
      if (refreshToken != null && refreshToken.isNotEmpty) {
        await _storage.write(key: _kRefresh, value: refreshToken);
      }
    } catch (e) {
      if (kDebugMode) print('TokenStorage.saveTokens error: $e');
    }
  }

  Future<void> clear() async {
    try {
      await _storage.delete(key: _kAccess);
      await _storage.delete(key: _kRefresh);
    } catch (e) {
      if (kDebugMode) print('TokenStorage.clear error: $e');
    }
  }
}
