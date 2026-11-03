import 'package:flutter/material.dart';

import '../core/storage/token_storage.dart';

class SessionController extends ChangeNotifier {
  SessionController(this._tokenStorage);

  final TokenStorage _tokenStorage;

  String? accessToken;
  String? refreshToken;
  Map<String, dynamic>? user;
  bool bootstrapped = false;

  bool get isAuthenticated => (accessToken ?? '').isNotEmpty;

  String get role {
    final raw = (user?['role'] ?? '').toString().toLowerCase();
    if (raw.contains('admin')) return 'admin';
    if (raw.contains('owner') || raw.contains('business')) return 'owner';
    return 'user';
  }

  Future<void> bootstrap() async {
    accessToken = await _tokenStorage.getAccessToken();
    refreshToken = await _tokenStorage.getRefreshToken();
    bootstrapped = true;
    notifyListeners();
  }

  Future<void> setAuth({
    required String token,
    String? refresh,
    Map<String, dynamic>? userPayload,
  }) async {
    accessToken = token;
    refreshToken = refresh ?? refreshToken;
    user = userPayload ?? user;
    await _tokenStorage.saveTokens(accessToken: token, refreshToken: refreshToken);
    notifyListeners();
  }

  Future<void> clear() async {
    accessToken = null;
    refreshToken = null;
    user = null;
    await _tokenStorage.clear();
    notifyListeners();
  }
}
