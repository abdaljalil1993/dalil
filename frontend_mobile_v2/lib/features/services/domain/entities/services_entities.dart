/// Active offer (`GET /offers`) — public, no UseCase (pass-through read).
class Offer {
  const Offer({
    required this.id,
    required this.title,
    this.description,
    this.discountPercent,
    this.couponCode,
    this.endDate,
    this.businessId,
    this.businessName,
    this.image,
  });

  final int id;
  final String title;
  final String? description;
  final int? discountPercent;
  final String? couponCode;
  final DateTime? endDate;
  final String? businessId;
  final String? businessName;
  final String? image;

  bool get isExpired => endDate != null && endDate!.isBefore(DateTime.now());
}

/// Emergency / public service number (`GET /emergency`).
class EmergencyNumber {
  const EmergencyNumber({
    required this.id,
    required this.type,
    required this.name,
    required this.phone,
    this.phone2,
    this.note,
  });

  final int id;
  final String type;
  final String name;
  final String phone;
  final String? phone2;
  final String? note;
}

/// One on-duty pharmacy entry (`GET /pharmacies/on-duty` → `{date, items}`).
class DutyPharmacy {
  const DutyPharmacy({
    required this.name,
    this.phone,
    this.address,
    this.cityName,
    this.businessId,
    this.from,
    this.to,
  });

  final String name;
  final String? phone;
  final String? address;
  final String? cityName;
  final String? businessId;
  final String? from;
  final String? to;
}