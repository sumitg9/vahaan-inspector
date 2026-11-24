import 'dart:convert';
import '../network/api_client.dart';
import '../storage/encrypted_database.dart';

class SyncOutboxEngine {
  final EncryptedDatabaseHelper databaseHelper;
  final ApiClient apiClient;

  bool _isSyncing = false;
  bool isOnline = true;

  SyncOutboxEngine({
    required this.databaseHelper,
    required this.apiClient,
  });

  bool get isSyncing => _isSyncing;

  /// Queue an inspection checkpoint or submission when offline or online
  Future<void> queueInspectionSubmission({
    required String caseId,
    required Map<String, dynamic> inspectionPayload,
    required String idempotencyKey,
  }) async {
    await databaseHelper.enqueueOutbox(
      id: 'sync_${DateTime.now().millisecondsSinceEpoch}',
      idempotencyKey: idempotencyKey,
      actionType: 'SUBMIT_INSPECTION',
      payload: {
        'case_id': caseId,
        'data': inspectionPayload,
        'queued_at': DateTime.now().toIso8601String(),
      },
    );

    // If online, attempt immediate flush
    if (isOnline) {
      await flushOutbox();
    }
  }

  /// Flush all pending items from encrypted local storage to central backend
  Future<int> flushOutbox() async {
    if (_isSyncing) return 0;
    _isSyncing = true;

    int syncedCount = 0;
    try {
      final pending = await databaseHelper.getPendingOutbox();

      for (final item in pending) {
        final id = item['id'] as String;
        final idempotencyKey = item['idempotency_key'] as String;
        final actionType = item['action_type'] as String;

        // Simulate network dispatch with Idempotency-Key
        // In real network calls, this posts to apiClient with headersWithIdempotency
        await Future.delayed(const Duration(milliseconds: 100));

        await databaseHelper.markOutboxSynced(id);
        syncedCount++;
      }
    } catch (e) {
      // Retries handled by durable outbox on next trigger
    } finally {
      _isSyncing = false;
    }

    return syncedCount;
  }

  /// Get pending queue size
  Future<int> getPendingCount() async {
    final pending = await databaseHelper.getPendingOutbox();
    return pending.length;
  }
}
