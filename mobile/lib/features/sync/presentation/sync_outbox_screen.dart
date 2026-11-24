import 'package:flutter/material.dart';
import '../../../core/storage/encrypted_database.dart';
import '../../../core/sync/sync_outbox_engine.dart';
import '../../../core/theme/app_theme.dart';

class SyncOutboxScreen extends StatefulWidget {
  final SyncOutboxEngine syncEngine;
  final EncryptedDatabaseHelper databaseHelper;

  const SyncOutboxScreen({
    super.key,
    required this.syncEngine,
    required this.databaseHelper,
  });

  @override
  State<SyncOutboxScreen> createState() => _SyncOutboxScreenState();
}

class _SyncOutboxScreenState extends State<SyncOutboxScreen> {
  List<Map<String, dynamic>> _pendingItems = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadOutbox();
  }

  void _loadOutbox() async {
    final pending = await widget.databaseHelper.getPendingOutbox();
    setState(() {
      _pendingItems = pending;
    });
  }

  void _triggerSync() async {
    setState(() => _isLoading = true);
    final count = await widget.syncEngine.flushOutbox();
    _loadOutbox();
    setState(() => _isLoading = false);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(count > 0
              ? 'Successfully synchronized $count offline mutation(s) to central backend.'
              : 'Outbox is up to date. Zero pending offline mutations.'),
          backgroundColor: AppTheme.tealSuccess,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Status Card
            Card(
              elevation: 1,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.between,
                      children: [
                        const Text(
                          'Durable Offline Outbox Engine',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.darkNavy),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: widget.syncEngine.isOnline
                                ? AppTheme.tealSuccess.withOpacity(0.12)
                                : AppTheme.amberWarning.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            widget.syncEngine.isOnline ? 'ONLINE' : 'OFFLINE',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: widget.syncEngine.isOnline ? AppTheme.tealSuccess : AppTheme.amberWarning,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'All physical inspection checklists, tyre audits, and damage photos captured without network connectivity are durably encrypted in local SQLite (AES-256).',
                      style: TextStyle(fontSize: 11, color: Colors.black54),
                    ),
                    const Divider(height: 20),

                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Pending Sync Queue:', style: TextStyle(fontSize: 11, color: Colors.grey)),
                            Text(
                              '${_pendingItems.length} Mutations',
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.darkNavy),
                            ),
                          ],
                        ),
                        SizedBox(
                          height: AppTheme.minTouchTargetSize,
                          child: ElevatedButton.icon(
                            icon: _isLoading
                                ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                : const Icon(Icons.sync, size: 18),
                            label: const Text('SYNC NOW'),
                            onPressed: _isLoading ? null : _triggerSync,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Queue List
            const Text(
              'Queued Transactional Outbox Items:',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.darkNavy),
            ),
            const SizedBox(height: 8),

            Expanded(
              child: _pendingItems.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.cloud_done_outlined, size: 48, color: Colors.grey.shade400),
                          const SizedBox(height: 8),
                          const Text('Encrypted Outbox Queue is Empty', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
                          const Text('All inspections synchronized with central server.', style: TextStyle(fontSize: 11, color: Colors.grey)),
                        ],
                      ),
                    )
                  : ListView.builder(
                      itemCount: _pendingItems.length,
                      itemBuilder: (context, idx) {
                        final item = _pendingItems[idx];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          child: ListTile(
                            leading: const CircleAvatar(
                              backgroundColor: AppTheme.primaryBlue,
                              child: Icon(Icons.outbox, color: Colors.white, size: 18),
                            ),
                            title: Text(item['action_type'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                            subtitle: Text('Idempotency: ${item['idempotency_key']}', style: const TextStyle(fontSize: 10, fontFamily: 'monospace')),
                            trailing: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(color: Colors.orange.withOpacity(0.15), borderRadius: BorderRadius.circular(4)),
                              child: const Text('QUEUED', style: TextStyle(color: Colors.orange, fontSize: 9, fontWeight: FontWeight.bold)),
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
