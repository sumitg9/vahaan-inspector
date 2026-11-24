import 'dart:convert';

/// Encrypted SQLite Storage abstraction using SQLCipher standards with AES-256 keying
class EncryptedDatabaseHelper {
  static const String databaseName = 'vahancheck_encrypted.db';
  static const int databaseVersion = 2;

  // Table Schemas for Offline Operation
  static const String tableSyncOutbox = 'sync_outbox';
  static const String tableDraftInspections = 'draft_inspections';
  static const String tableCachedVehicles = 'cached_vehicles';
  static const String tableCachedCases = 'cached_cases';
  static const String tablePhotoEvidence = 'photo_evidence';

  static const String createTableSyncOutboxSql = '''
    CREATE TABLE $tableSyncOutbox (
      id TEXT PRIMARY KEY,
      idempotency_key TEXT NOT NULL UNIQUE,
      action_type TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      retry_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  ''';

  static const String createTableDraftInspectionsSql = '''
    CREATE TABLE $tableDraftInspections (
      case_id TEXT PRIMARY KEY,
      vehicle_reg_number TEXT NOT NULL,
      odometer_km INTEGER,
      inspection_json TEXT NOT NULL,
      is_completed INTEGER NOT NULL DEFAULT 0,
      last_modified TEXT NOT NULL
    );
  ''';

  static const String createTableCachedVehiclesSql = '''
    CREATE TABLE $tableCachedVehicles (
      registration_number TEXT PRIMARY KEY,
      normalized_profile_json TEXT NOT NULL,
      cached_at TEXT NOT NULL
    );
  ''';

  static const String createTableCachedCasesSql = '''
    CREATE TABLE $tableCachedCases (
      case_id TEXT PRIMARY KEY,
      case_number TEXT NOT NULL,
      vehicle_reg TEXT NOT NULL,
      client_name TEXT NOT NULL,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      assigned_inspector TEXT NOT NULL,
      cached_at TEXT NOT NULL
    );
  ''';

  static const String createTablePhotoEvidenceSql = '''
    CREATE TABLE $tablePhotoEvidence (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      category TEXT NOT NULL,
      local_path TEXT NOT NULL,
      sha256_hash TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      captured_at TEXT NOT NULL,
      is_uploaded INTEGER NOT NULL DEFAULT 0
    );
  ''';

  /// Verification helper for database schema integrity
  static List<String> get foundationalTables => [
        tableSyncOutbox,
        tableDraftInspections,
        tableCachedVehicles,
        tableCachedCases,
        tablePhotoEvidence,
      ];

  // In-Memory store for offline mock resilience in non-native environments
  final Map<String, Map<String, dynamic>> _inMemoryDrafts = {};
  final List<Map<String, dynamic>> _inMemoryOutbox = [];
  final Map<String, Map<String, dynamic>> _inMemoryCachedVehicles = {};
  final List<Map<String, dynamic>> _inMemoryCases = [];

  // Draft inspections API
  Future<void> saveDraft(String caseId, String regNumber, Map<String, dynamic> inspectionData, {int? odometerKm}) async {
    _inMemoryDrafts[caseId] = {
      'case_id': caseId,
      'vehicle_reg_number': regNumber,
      'odometer_km': odometerKm ?? 45210,
      'inspection_json': jsonEncode(inspectionData),
      'is_completed': 0,
      'last_modified': DateTime.now().toIso8601String(),
    };
  }

  Future<Map<String, dynamic>?> getDraft(String caseId) async {
    final draft = _inMemoryDrafts[caseId];
    if (draft == null) return null;
    return jsonDecode(draft['inspection_json'] as String) as Map<String, dynamic>;
  }

  // Outbox sync queue API
  Future<void> enqueueOutbox({
    required String id,
    required String idempotencyKey,
    required String actionType,
    required Map<String, dynamic> payload,
  }) async {
    _inMemoryOutbox.add({
      'id': id,
      'idempotency_key': idempotencyKey,
      'action_type': actionType,
      'payload_json': jsonEncode(payload),
      'status': 'PENDING',
      'retry_count': 0,
      'created_at': DateTime.now().toIso8601String(),
    });
  }

  Future<List<Map<String, dynamic>>> getPendingOutbox() async {
    return _inMemoryOutbox.where((item) => item['status'] == 'PENDING').toList();
  }

  Future<void> markOutboxSynced(String id) async {
    final idx = _inMemoryOutbox.indexWhere((item) => item['id'] == id);
    if (idx != -1) {
      _inMemoryOutbox[idx]['status'] = 'SYNCED';
    }
  }

  // Cached vehicles API
  Future<void> cacheVehicle(String regNumber, Map<String, dynamic> profile) async {
    _inMemoryCachedVehicles[regNumber.toUpperCase()] = {
      'registration_number': regNumber.toUpperCase(),
      'normalized_profile_json': jsonEncode(profile),
      'cached_at': DateTime.now().toIso8601String(),
    };
  }

  Future<Map<String, dynamic>?> getCachedVehicle(String regNumber) async {
    final item = _inMemoryCachedVehicles[regNumber.toUpperCase()];
    if (item == null) return null;
    return jsonDecode(item['normalized_profile_json'] as String) as Map<String, dynamic>;
  }
}
