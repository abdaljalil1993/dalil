import 'package:flutter_test/flutter_test.dart';

import 'package:dalilak_mobile/core/error/failures.dart';
import 'package:dalilak_mobile/core/error/result.dart';
import 'package:dalilak_mobile/core/network/api_envelope.dart';
import 'package:dalilak_mobile/features/services/domain/entities/feature_switches.dart';

void main() {
  group('Result', () {
    test('success carries data and reports isSuccess', () {
      final ok = Success(42);
      expect(ok.isSuccess, isTrue);
      expect(ok.isFailure, isFalse);
      expect(ok.dataOrNull, 42);
      expect(ok.failureOrNull, isNull);
    });

    test('failure carries the failure and maps correctly', () {
      const f = Failure(message: 'boom', status: 500);
      final bad = FailureResult<int>(f);
      expect(bad.isFailure, isTrue);
      expect(bad.dataOrNull, isNull);
      expect(bad.failureOrNull, f);

      final mapped = bad.map((v) => '$v');
      expect(mapped.isFailure, isTrue);
    });

    test('when() routes to the right branch', () {
      final ok = Success<String>('hi');
      expect(
        ok.when(success: (d) => d, onFailure: (_) => 'no'),
        'hi',
      );
      final bad = FailureResult<String>(const Failure(message: 'nope'));
      expect(
        bad.when(success: (d) => d, onFailure: (f) => f.message),
        'nope',
      );
    });
  });

  group('ApiEnvelope', () {
    test('parses a success envelope with meta', () {
      final e = ApiEnvelope.fromJson(<String, dynamic>{
        'success': true,
        'message': 'ok',
        'data': [
          {'id': 1},
          {'id': 2},
        ],
        'meta': {'total': 40, 'page': 2, 'limit': 20, 'hasNext': true},
      });
      expect(e.success, isTrue);
      expect(e.meta?.hasNextPage, isTrue);
      expect(e.meta?.total, 40);
    });

    test('parses an error envelope into a Failure with field errors', () {
      final e = ApiEnvelope.fromJson(<String, dynamic>{
        'success': false,
        'message': 'Validation failed',
        'code': 'VALIDATION',
        'errors': [
          {'field': 'email', 'message': 'Invalid email address'},
        ],
      });
      final f = e.toFailure(status: 422);
      expect(f.message, 'Validation failed');
      expect(f.status, 422);
      expect(f.fieldErrors['email'], 'Invalid email address');
      expect(f.isValidation, isTrue);
    });

    test('detects plan-limit (402) and feature-disabled (403) codes', () {
      const plan = Failure(
        message: 'Upgrade your plan',
        status: 402,
        code: 'PLAN_LIMIT',
      );
      expect(plan.isPlanLimit, isTrue);

      const off = Failure(
        message: 'Not available',
        status: 403,
        code: 'FEATURE_DISABLED',
      );
      expect(off.isFeatureDisabled, isTrue);
    });
  });

  group('FeatureSwitches (v2.1)', () {
    test('reads enabled flags and defaults unknown keys to ON', () {
      final s = FeatureSwitches.fromApi({
        'cityId': 6,
        'enabled': {'offers': true, 'jobs': false},
      });
      expect(s.cityId, 6);
      expect(s.offers, isTrue);
      expect(s.jobs, isFalse);
      // unknown key → ON so a future backend addition doesn't blank the UI
      expect(s.on('someFutureKey'), isTrue);
    });

    test('empty response → everything visible', () {
      expect(FeatureSwitches.allOn.offers, isTrue);
      expect(FeatureSwitches.allOn.jobs, isTrue);
    });
  });
}
