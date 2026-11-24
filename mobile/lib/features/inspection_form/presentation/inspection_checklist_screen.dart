import 'package:flutter/material.dart';
import '../../../core/storage/encrypted_database.dart';
import '../../../core/sync/sync_outbox_engine.dart';
import '../../../core/theme/app_theme.dart';

class InspectionChecklistScreen extends StatefulWidget {
  final Map<String, dynamic> caseData;
  final SyncOutboxEngine syncEngine;
  final EncryptedDatabaseHelper databaseHelper;

  const InspectionChecklistScreen({
    super.key,
    required this.caseData,
    required this.syncEngine,
    required this.databaseHelper,
  });

  @override
  State<InspectionChecklistScreen> createState() => _InspectionChecklistScreenState();
}

class _InspectionChecklistScreenState extends State<InspectionChecklistScreen> {
  // Invariant 3: Prohibition of Data Fabrication — Uninspected checkpoints MUST default to 'not_checked', never 'Pass'
  late List<Map<String, dynamic>> _checkpoints;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _initCheckpoints();
  }

  void _initCheckpoints() {
    _checkpoints = [
      {'category': 'Cabin Structure', 'item': 'Cabin Outer Sheet Metal & Cowl', 'status': 'not_checked', 'remarks': ''},
      {'category': 'Cabin Structure', 'item': 'Cabin Floor & Mounting Bushes', 'status': 'not_checked', 'remarks': ''},
      {'category': 'Load Platform', 'item': 'Load Bed Floor Plate (8mm Steel)', 'status': 'not_checked', 'remarks': ''},
      {'category': 'Load Platform', 'item': 'Side Walls & Hydraulic Tailgate', 'status': 'not_checked', 'remarks': ''},
      {'category': 'Chassis Frame', 'item': 'Main Longitudinal Ladder Side Members', 'status': 'not_checked', 'remarks': ''},
      {'category': 'Chassis Frame', 'item': 'Cross Members & Structural Riveting', 'status': 'not_checked', 'remarks': ''},
      {'category': 'Powertrain', 'item': 'Engine Cold Start & Idling Rhythm', 'status': 'not_checked', 'remarks': ''},
      {'category': 'Powertrain', 'item': 'Engine Lubrication & Sump Integrity', 'status': 'not_checked', 'remarks': ''},
      {'category': 'Drivetrain', 'item': 'Clutch Engagement & Pedal Free Play', 'status': 'not_checked', 'remarks': ''},
      {'category': 'Drivetrain', 'item': 'Synchromesh Gearbox Shifting (9-Speed)', 'status': 'not_checked', 'remarks': ''},
      {'category': 'Brakes & Air', 'item': 'Dual Circuit Full Air S-Cam Brakes', 'status': 'not_checked', 'remarks': ''},
      {'category': 'Electricals', 'item': '24V Heavy Commercial Batteries (2x12V)', 'status': 'not_checked', 'remarks': ''},
      {'category': 'Safety Kit', 'item': 'Speed Governor Device (80 km/h Limit)', 'status': 'not_checked', 'remarks': ''},
      {'category': 'Safety Kit', 'item': 'High Security Registration Plates (HSRP)', 'status': 'not_checked', 'remarks': ''},
      {'category': 'Documents Match', 'item': 'Original Physical RC Smart Card Match', 'status': 'not_checked', 'remarks': ''},
      {'category': 'Documents Match', 'item': 'Chassis Number Stamping on Frame Flange', 'status': 'not_checked', 'remarks': ''},
    ];
  }

  void _setCheckpointStatus(int index, String status) {
    setState(() {
      _checkpoints[index]['status'] = status;
    });
  }

  void _saveDraft() async {
    setState(() => _isSaving = true);
    await widget.databaseHelper.saveDraft(
      widget.caseData['id'],
      widget.caseData['vehicle_reg'],
      {'checkpoints': _checkpoints},
    );
    setState(() => _isSaving = false);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Draft saved locally in AES-256 Encrypted SQLite.'),
          backgroundColor: AppTheme.tealSuccess,
        ),
      );
    }
  }

  void _submitForQc() async {
    // Check if any checkpoints remain not_checked
    final uncheckedCount = _checkpoints.where((c) => c['status'] == 'not_checked').length;
    if (uncheckedCount > 0) {
      final proceed = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Unverified Checkpoints Notice'),
          content: Text('$uncheckedCount checkpoint(s) remain "not_checked". In accordance with Invariant 3, uninspected items will be preserved as unverified. Proceed with submission?'),
          actions: [
            TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Cancel')),
            ElevatedButton(onPressed: () => Navigator.of(ctx).pop(true), child: const Text('Proceed')),
          ],
        ),
      );
      if (proceed != true) return;
    }

    setState(() => _isSaving = true);

    final idempotencyKey = 'idemp_sub_${widget.caseData['id']}_${DateTime.now().millisecondsSinceEpoch}';

    await widget.syncEngine.queueInspectionSubmission(
      caseId: widget.caseData['id'],
      inspectionPayload: {'checkpoints': _checkpoints},
      idempotencyKey: idempotencyKey,
    );

    setState(() => _isSaving = false);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Inspection submitted! Queued in durable outbox for Valuer QC.'),
          backgroundColor: AppTheme.tealSuccess,
        ),
      );
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Checklist: ${widget.caseData['vehicle_reg']}'),
            Text(widget.caseData['case_number'], style: const TextStyle(fontSize: 10, color: Colors.white70)),
          ],
        ),
      ),
      body: Column(
        children: [
          // Banner Notice
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            color: AppTheme.primaryBlue.withOpacity(0.08),
            child: const Row(
              children: [
                Icon(Icons.info_outline, size: 16, color: AppTheme.primaryBlue),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Invariant 3: Unchecked items remain strictly "not_checked" and never default to Pass.',
                    style: TextStyle(fontSize: 11, color: AppTheme.primaryBlue, fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ),

          // Checkpoints List
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: _checkpoints.length,
              itemBuilder: (context, index) {
                final cp = _checkpoints[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.between,
                          children: [
                            Text(cp['category'], style: const TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold)),
                            _buildStatusPill(cp['status']),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(cp['item'], style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.darkNavy)),
                        const SizedBox(height: 10),

                        // Action Segment (Min 48dp touch target)
                        Row(
                          children: [
                            Expanded(
                              child: _buildChoiceBtn(
                                label: 'Pass',
                                isSelected: cp['status'] == 'Pass',
                                activeColor: AppTheme.tealSuccess,
                                onTap: () => _setCheckpointStatus(index, 'Pass'),
                              ),
                            ),
                            const SizedBox(width: 6),
                            Expanded(
                              child: _buildChoiceBtn(
                                label: 'Fail',
                                isSelected: cp['status'] == 'Fail',
                                activeColor: AppTheme.redAlert,
                                onTap: () => _setCheckpointStatus(index, 'Fail'),
                              ),
                            ),
                            const SizedBox(width: 6),
                            Expanded(
                              child: _buildChoiceBtn(
                                label: 'Not Checked',
                                isSelected: cp['status'] == 'not_checked',
                                activeColor: Colors.grey.shade700,
                                onTap: () => _setCheckpointStatus(index, 'not_checked'),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          // Bottom Action Bar
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 8, offset: const Offset(0, -2))],
            ),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(minimumSize: const Size(0, AppTheme.minTouchTargetSize)),
                    icon: const Icon(Icons.save_outlined, size: 18),
                    label: const Text('Save Draft'),
                    onPressed: _isSaving ? null : _saveDraft,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(minimumSize: const Size(0, AppTheme.minTouchTargetSize)),
                    icon: const Icon(Icons.send_rounded, size: 18),
                    label: const Text('Submit QC'),
                    onPressed: _isSaving ? null : _submitForQc,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusPill(String status) {
    Color bg = Colors.grey.shade200;
    Color fg = Colors.grey.shade800;
    if (status == 'Pass') {
      bg = AppTheme.tealSuccess.withOpacity(0.12);
      fg = AppTheme.tealSuccess;
    } else if (status == 'Fail') {
      bg = AppTheme.redAlert.withOpacity(0.12);
      fg = AppTheme.redAlert;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(4)),
      child: Text(status.toUpperCase(), style: TextStyle(color: fg, fontSize: 9, fontWeight: FontWeight.bold)),
    );
  }

  Widget _buildChoiceBtn({
    required String label,
    required bool isSelected,
    required Color activeColor,
    required VoidCallback onTap,
  }) {
    return SizedBox(
      height: AppTheme.minTouchTargetSize,
      child: OutlinedButton(
        style: OutlinedButton.styleFrom(
          backgroundColor: isSelected ? activeColor.withOpacity(0.15) : Colors.transparent,
          side: BorderSide(color: isSelected ? activeColor : Colors.grey.shade300, width: isSelected ? 2 : 1),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
          padding: EdgeInsets.zero,
        ),
        onPressed: onTap,
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            color: isSelected ? activeColor : Colors.black87,
          ),
        ),
      ),
    );
  }
}
