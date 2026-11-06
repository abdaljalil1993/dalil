import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/network/api_client.dart';
import '../domain/entities/home_feed.dart';

/// Handoff rule #3: `impression` when an ad is SHOWN, `click` when it is
/// tapped — then deep-link: `/b/` `/c/` open INSIDE the app, external URLs
/// go to the browser. Deduplicated per banner per app run.
class AdTracking {
  AdTracking(this._api);

  final ApiClient _api;
  final Set<String> _impressed = {};

  int? _id(AdBanner ad) => int.tryParse(ad.id);

  void impression(AdBanner ad) {
    final id = _id(ad);
    if (id == null || !_impressed.add(ad.id)) return;
    _api.post<void>(ApiEndpoints.advertisementImpression(ad.id)); // fire-and-forget
  }

  Future<void> click(AdBanner ad) async {
    final id = _id(ad);
    if (id != null) {
      await _api.post<void>(ApiEndpoints.advertisementClick(ad.id)); // analytics first
    }
  }

  /// Returns `true` when the click was handled in-app (deep link or
  /// business), `false` when the caller should open an external URL.
  bool openInApp(Uri uri, AdBanner ad, void Function(String location) go) {
    final target = ad.targetUrl;
    if (target != null && target.isNotEmpty) {
      if (target.startsWith('/')) {
        go(target); // /b/:slug · /c/:slug · any in-app path
        return true;
      }
      if (target.startsWith('http')) return false; // external
    }
    if (ad.businessId != null && ad.businessId!.isNotEmpty) {
      go('/businesses/${ad.businessId}');
      return true;
    }
    return false;
  }

  Future<bool> openExternal(String target) => launchUrl(
        Uri.parse(target),
        mode: LaunchMode.externalApplication,
      );
}

final adTrackingProvider = Provider<AdTracking>(
  (ref) => AdTracking(ref.watch(apiClientProvider)),
);