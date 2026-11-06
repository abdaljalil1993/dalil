import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/error/result.dart';
import '../../../../core/network/api_client.dart';
import '../domain/entities/services_entities.dart';

/// v2.1 public reads (offers / on-duty pharmacies / emergency numbers).
/// Pass-through — no UseCase per the conventions decision matrix.
class ServicesRepository {
  ServicesRepository(this._api);

  final ApiClient _api;

  Future<Result<List<Offer>>> offers() async {
    final res = await _api.get<List<dynamic>>(ApiEndpoints.offers);
    return res.map(
      (raw) => raw
          .whereType<Map<String, dynamic>>()
          .map(_offerFromJson)
          .toList(),
    );
  }

  Future<Result<List<EmergencyNumber>>> emergency() async {
    final res = await _api.get<List<dynamic>>(ApiEndpoints.emergency);
    return res.map(
      (raw) => raw
          .whereType<Map<String, dynamic>>()
          .map(_emergencyFromJson)
          .toList(),
    );
  }

  /// Response: `{ date: 'YYYY-MM-DD', items: [ … ] }` (v2.1).
  Future<Result<List<DutyPharmacy>>> onDutyPharmacies() async {
    final res = await _api.get<Map<String, dynamic>>(ApiEndpoints.pharmaciesOnDuty);
    return res.map((raw) {
      final items = raw['items'];
      if (items is! List) return <DutyPharmacy>[];
      return items.whereType<Map<String, dynamic>>().map(_dutyFromJson).toList();
    });
  }

  // ── tolerant parsers (shape-tolerant: fields may move between versions) ──

  Offer _offerFromJson(Map<String, dynamic> j) => Offer(
        id: (j['id'] as num?)?.toInt() ?? 0,
        title: (j['title'] ?? '').toString(),
        description: j['description']?.toString(),
        discountPercent: (j['discountPercent'] as num?)?.toInt(),
        couponCode: j['couponCode']?.toString(),
        endDate: DateTime.tryParse((j['endDate'] ?? '').toString()),
        businessId: j['businessId']?.toString(),
        businessName: j['businessName']?.toString() ??
            (j['business'] is Map
                ? (j['business'] as Map)['name']?.toString()
                : null),
        image: (j['image'] ?? j['imageUrl'])?.toString(),
      );

  EmergencyNumber _emergencyFromJson(Map<String, dynamic> j) =>
      EmergencyNumber(
        id: (j['id'] as num?)?.toInt() ?? 0,
        type: (j['type'] ?? 'other').toString(),
        name: (j['name'] ?? '').toString(),
        phone: (j['phone'] ?? '').toString(),
        phone2: j['phone2']?.toString(),
        note: j['note']?.toString(),
      );

  DutyPharmacy _dutyFromJson(Map<String, dynamic> j) {
    final business = j['business'];
    final biz = business is Map<String, dynamic> ? business : const {};
    return DutyPharmacy(
      name: (biz['name'] ?? j['name'] ?? 'صيدلية').toString(),
      phone: (biz['phone'] ?? j['phone'])?.toString(),
      address: (biz['address'] ?? j['address'])?.toString(),
      cityName: (biz['city'] is Map
          ? (biz['city'] as Map)['name']?.toString()
          : j['cityName']?.toString()),
      businessId: (biz['id'] ?? j['businessId'])?.toString(),
      from: (j['from'] ?? j['startTime'])?.toString(),
      to: (j['to'] ?? j['endTime'])?.toString(),
    );
  }
}