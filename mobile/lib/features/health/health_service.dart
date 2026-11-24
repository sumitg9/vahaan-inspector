import '../../core/network/api_client.dart';
import '../../core/storage/encrypted_database.dart';

class MobileHealthResult {
  final bool isHealthy;
  final String status;
  final Map<String, dynamic> diagnostics;

  MobileHealthResult({
    required this.isHealthy,
    required this.status,
    required this.diagnostics,
  });
}

class MobileHealthService {
  final ApiClient apiClient;

  MobileHealthService({required this.apiClient});

  Future<MobileHealthResult> evaluateStatus() async {
    final clientHealth = await apiClient.checkHealth();
    final tables = EncryptedDatabaseHelper.foundationalTables;

    return MobileHealthResult(
      isHealthy: true,
      status: 'operational',
      diagnostics: {
        'network': clientHealth,
        'encrypted_storage_tables': tables,
        'min_touch_target_dp': 48,
        'role_navigation': ['OFFICE_ADMIN', 'FIELD_INSPECTOR'],
      },
    );
  }
}
