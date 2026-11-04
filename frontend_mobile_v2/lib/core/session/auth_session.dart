import 'package:flutter/foundation.dart';

import '../storage/token_storage.dart';

/// Holds the auth state and notifies the router when it changes.
///
/// Tokens live in [TokenStorage] (secure); this class keeps an in-memory copy
/// so the interceptor can read it synchronously.
class AuthSession extends ChangeNotifier {
  AuthSession(this._storage);

  final TokenStorage _storage;

  String? _access;
  String? _refresh;
  Map<String, dynamic>? _user;
  bool _bootstrapped = false;

  String? get accessToken => _access;
  String? get refreshToken => _refresh;
  Map<String, dynamic>? get user => _user;
  bool get bootstrapped => _bootstrapped;
  bool get isAuthenticated => (_access ?? '').isNotEmpty;

  /// role: user | business_owner | admin
  String get role {
    final raw = (_user?['role'] ?? '').toString().toLowerCase();
    if (raw.contains('admin')) return 'admin';
    if (raw.contains('owner') || raw.contains('business')) return 'owner';
    return 'user';
  }

  bool get isAdmin => role == 'admin';
  bool get isOwner => role == 'owner';

  /// Reads persisted tokens once at startup.
  Future<void> bootstrap() async {
    _access = await _storage.readAccessToken();
    _refresh = await _storage.readRefreshToken();
    _bootstrapped = true;
    notifyListeners();
  }

  Future<void> setAuth({
    required String accessToken,
    String? refreshToken,
    Map<String, dynamic>? user,
  }) async {
    _access = accessToken;
    if (refreshToken != null && refreshToken.isNotEmpty) _refresh = refreshToken;
    if (user != null) _user = user;
    await _storage.saveTokens(
      accessToken: accessToken,
      refreshToken: _refresh,
    );
    notifyListeners();
  }

  void setUser(Map<String, dynamic>? user) {
    _user = user;
    notifyListeners();
  }

  Future<void> clear() async {
    _access = null;
    _refresh = null;
    _user = null;
    await _storage.clear();
    notifyListeners();
  }
}
