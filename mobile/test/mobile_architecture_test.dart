import 'package:flutter_test/flutter_test.dart';
import 'package:vahancheck_mobile/core/theme/app_theme.dart';
import 'package:vahancheck_mobile/core/network/api_client.dart';
import 'package:vahancheck_mobile/core/storage/encrypted_database.dart';
import 'package:vahancheck_mobile/features/health/health_service.dart';

void main() {
  group('Mobile Architecture & Health Verification', () {
    test('App theme enforces minimum 48dp touch target standard', () {
      expect(AppTheme.minTouchTargetSize, greaterThanOrEqualTo(48.0));
      expect(AppTheme.darkNavy.value, equals(0xFF0F172A));
      expect(AppTheme.primaryBlue.value, equals(0xFF2563EB));
    });

    test('Encrypted SQLite schema defines foundational offline tables', () {
      final tables = EncryptedDatabaseHelper.foundationalTables;
      expect(tables, contains('sync_outbox'));
      expect(tables, contains('draft_inspections'));
      expect(tables, contains('cached_vehicles'));
    });

    test('Health service reports operational diagnostics', () async {
      final client = ApiClient(baseUrl: 'http://localhost:8000/api/v1');
      final healthService = MobileHealthService(apiClient: client);

      final result = await healthService.evaluateStatus();
      expect(result.isHealthy, isTrue);
      expect(result.status, equals('operational'));
      expect(result.diagnostics['min_touch_target_dp'], equals(48));
    });
  });
}
