import 'package:url_launcher/url_launcher.dart';

import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/entities/business.dart';

/// Fire-and-forget contact actions for a business.
///
/// Handoff rule #2: `POST /businesses/{id}/track` FIRST, then open the
/// platform channel. Rule #4: WhatsApp `09…` → `9639…`; directions open
/// Google Maps with `origin=me`.
class ContactActions {
  ContactActions(this._api);

  final ApiClient _api;

  /// Tracks without awaiting the outcome (analytics must not slow the UX),
  /// but the request still goes out before the platform intent opens.
  Future<void> _track(String businessId, String type) =>
      _api.post<void>(ApiEndpoints.businessTrack(businessId), body: {
        'type': type,
      });

  Future<void> call(Business b) async {
    final phone = (b.phone ?? '').replaceAll(RegExp(r'[^\d+]'), '');
    if (phone.isEmpty) return;
    await _track(b.id, 'phone');
    await launchUrl(Uri.parse('tel:$phone'));
  }

  Future<void> whatsapp(Business b) async {
    var number = (b.whatsapp ?? b.phone ?? '').replaceAll(RegExp(r'[^\d]'), '');
    if (number.isEmpty) return;
    // 09XXXXXXXX → 9639XXXXXXXX (rule #4)
    if (number.startsWith('09')) number = '963${number.substring(1)}';
    await _track(b.id, 'whatsapp');
    await launchUrl(Uri.parse('https://wa.me/$number'),
        mode: LaunchMode.externalApplication);
  }

  Future<void> directions(Business b) async {
    final lat = b.latitude;
    final lng = b.longitude;
    if (lat == null || lng == null) return;
    await _track(b.id, 'directions');
    await launchUrl(
      Uri.parse(
          'https://www.google.com/maps/dir/?api=1&destination=$lat,$lng'),
      mode: LaunchMode.externalApplication,
    );
  }

  Future<void> website(Business b) async {
    var url = (b.website ?? '').trim();
    if (url.isEmpty) return;
    if (!url.startsWith('http')) url = 'https://$url';
    await _track(b.id, 'website');
    await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
  }
}