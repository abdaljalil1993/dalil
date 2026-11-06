import 'dart:convert';
import 'dart:io';

import 'package:dalilak_mobile/features/businesses/data/models/business_dto.dart';
import 'package:dalilak_mobile/features/home/data/mappers/home_mappers.dart';
import 'package:dalilak_mobile/features/home/data/models/home_dto.dart';
import 'package:flutter_test/flutter_test.dart';

/// Reproduces the exact parsing the home screen does with a REAL
/// `GET /home` response captured from the running backend — so any
/// crash inside `HomeRepositoryImpl.getHomeFeed`'s try-block surfaces
/// here with its real exception instead of the generic message.
void main() {
  test('HomeFeedDto parses a real /home envelope and maps to entity', () {
    final raw = File('test/fixtures_home.json').readAsStringSync();
    final envelope = jsonDecode(raw) as Map<String, dynamic>;
    expect(envelope['success'], isTrue);

    final data = envelope['data'] as Map<String, dynamic>;
    final dto = HomeFeedDto.fromJson(data); // may throw → real culprit
    final feed = dto.toEntity(); // may throw → real culprit

    // ignore: avoid_print
    print(
      'PARSED OK — categories=${feed.categories.length} '
      'cities=${feed.cities.length} ads=${feed.adBanners.length} '
      'featured=${feed.featured.length} offers=${feed.offers?.length ?? 0} '
      'stats=${feed.stats != null}',
    );
    expect(feed.categories, isNotEmpty);
    expect(feed.cities, isNotEmpty);
  });

  test('Business and ad entries with real API shapes parse safely', () {
    // A business exactly as `GET /businesses` returns it (int id!).
    final businessJson = <String, dynamic>{
      'id': 5,
      'slug': 'sham-hospital',
      'name': 'مستشفى الشام',
      'nameEn': 'Sham Hospital',
      'description': 'مستشفى عام',
      'category': <String, dynamic>{'id': 1, 'name': 'أطباء', 'slug': 'doctors'},
      'city': <String, dynamic>{'id': 1, 'name': 'دمشق', 'slug': 'damascus'},
      'averageRating': 4.5,
      'reviewCount': 12,
      'isFeatured': true,
      'isVerified': true,
      'isActive': true,
      'status': 'approved',
      'createdAt': '2026-11-05T15:22:24.519Z',
      'isOpenNow': true,
      'phone': '0912345678',
    };
    final business = BusinessDto.fromJson(businessJson);
    expect(business.id, '5');

    // An ad as inside `ads.slider`.
    final adJson = <String, dynamic>{
      'id': 3,
      'title': 'إعلان',
      'imageUrl': null,
      'targetUrl': '/b/sham-hospital',
      'placement': 'home_slider',
    };
    final ad = AdBannerDto.fromJson(adJson);
    expect(ad.id, '3');
  });
}