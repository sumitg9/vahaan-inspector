import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/encrypted_database.dart';
import '../../../core/sync/sync_outbox_engine.dart';
import '../../../core/theme/app_theme.dart';
import '../../inspection_form/presentation/inspection_checklist_screen.dart';
import '../../camera/presentation/camera_evidence_screen.dart';
import '../../tyres/presentation/tyre_inspection_screen.dart';
import '../../reports/presentation/mobile_report_viewer_screen.dart';

class AssignedCasesScreen extends StatefulWidget {
  final ApiClient apiClient;
  final SyncOutboxEngine syncEngine;
  final EncryptedDatabaseHelper databaseHelper;

  const AssignedCasesScreen({
    super.key,
    required this.apiClient,
    required this.syncEngine,
    required this.databaseHelper,
  });

  @override
  State<AssignedCasesScreen> createState() => _AssignedCasesScreenState();
}

class _AssignedCasesScreenState extends State<AssignedCasesScreen> {
  String _selectedFilter = 'ALL';
  String _searchQuery = '';

  final List<Map<String, dynamic>> _mockCases = [
    {
      'id': 'case-001',
      'case_number': 'INSP-2026-001',
      'vehicle_reg': 'MH12PQ9876',
      'vehicle_model': 'Tata Motors LPT 3118 TC 6x2 Tipper',
      'client_name': 'State Bank of India',
      'branch_name': 'Mumbai Fort Commercial',
      'status': 'IN_PROGRESS',
      'priority': 'URGENT',
      'inspection_address': 'Hadapsar Industrial Area, Pune',
      'odometer_km': 148210,
    },
    {
      'id': 'case-002',
      'case_number': 'INSP-2026-002',
      'vehicle_reg': 'MH14XY5678',
      'vehicle_model': 'Ashok Leyland 2820 Tipper',
      'client_name': 'HDFC Bank Ltd',
      'branch_name': 'Pune Auto Branch',
      'status': 'ASSIGNED',
      'priority': 'HIGH',
      'inspection_address': 'Bhosari MIDC, Pune',
      'odometer_km': 92450,
    },
    {
      'id': 'case-003',
      'case_number': 'INSP-2026-003',
      'vehicle_reg': 'MH04AB1234',
      'vehicle_model': 'Eicher Pro 3019 Truck',
      'client_name': 'ICICI Bank Commercial',
      'branch_name': 'Thane Commercial Branch',
      'status': 'APPROVED',
      'priority': 'NORMAL',
      'inspection_address': 'Wagle Estate, Thane',
      'odometer_km': 64100,
    },
  ];

  @override
  Widget build(BuildContext context) {
    final filtered = _mockCases.where((c) {
      final matchesFilter = _selectedFilter == 'ALL' || c['status'] == _selectedFilter;
      final matchesSearch = c['vehicle_reg'].toString().toLowerCase().contains(_searchQuery.toLowerCase()) ||
          c['case_number'].toString().toLowerCase().contains(_searchQuery.toLowerCase()) ||
          c['client_name'].toString().toLowerCase().contains(_searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    }).toList();

    return Scaffold(
      body: Column(
        children: [
          // Search & Filter Header
          Container(
            padding: const EdgeInsets.all(12.0),
            color: Colors.white,
            child: Column(
              children: [
                TextField(
                  onChanged: (val) => setState(() => _searchQuery = val),
                  decoration: InputDecoration(
                    hintText: 'Search reg no, case ID or bank...',
                    prefixIcon: const Icon(Icons.search, size: 20),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8.0)),
                    filled: true,
                    fillColor: AppTheme.canvasLight,
                  ),
                ),
                const SizedBox(height: 8),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: ['ALL', 'ASSIGNED', 'IN_PROGRESS', 'APPROVED'].map((filter) {
                      final isSelected = _selectedFilter == filter;
                      return Padding(
                        padding: const EdgeInsets.only(right: 6.0),
                        child: FilterChip(
                          label: Text(filter, style: TextStyle(fontSize: 11, fontWeight: isSelected ? FontWeight.bold : FontWeight.normal)),
                          selected: isSelected,
                          onSelected: (_) => setState(() => _selectedFilter = filter),
                          selectedColor: AppTheme.primaryBlue.withOpacity(0.15),
                          checkmarkColor: AppTheme.primaryBlue,
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
          ),

          // Cases List
          Expanded(
            child: filtered.isEmpty
                ? const Center(
                    child: Text('No inspection cases match the selected filter.', style: TextStyle(color: Colors.grey)),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(12.0),
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      final item = filtered[index];
                      return _buildCaseCard(item);
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildCaseCard(Map<String, dynamic> item) {
    final statusColor = item['status'] == 'APPROVED'
        ? AppTheme.tealSuccess
        : item['status'] == 'IN_PROGRESS'
            ? AppTheme.primaryBlue
            : AppTheme.amberWarning;

    return Card(
      elevation: 1,
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: Padding(
        padding: const EdgeInsets.all(14.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Row: Reg No & Status Badges
            Row(
              mainAxisAlignment: MainAxisAlignment.between,
              children: [
                Row(
                  children: [
                    Text(
                      item['vehicle_reg'],
                      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: AppTheme.darkNavy),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: item['priority'] == 'URGENT' ? AppTheme.redAlert.withOpacity(0.1) : Colors.orange.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: item['priority'] == 'URGENT' ? AppTheme.redAlert : Colors.orange),
                      ),
                      child: Text(
                        item['priority'],
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                          color: item['priority'] == 'URGENT' ? AppTheme.redAlert : Colors.orange.shade800,
                        ),
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: statusColor),
                  ),
                  child: Text(
                    item['status'],
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: statusColor),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),

            // Vehicle Model
            Text(
              item['vehicle_model'],
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.black87),
            ),
            const SizedBox(height: 4),

            // Client & Location
            Row(
              children: [
                const Icon(Icons.account_balance_outlined, size: 14, color: Colors.grey),
                const SizedBox(width: 4),
                Text('${item['client_name']} (${item['branch_name']})', style: const TextStyle(fontSize: 11, color: Colors.black54)),
              ],
            ),
            const SizedBox(height: 2),
            Row(
              children: [
                const Icon(Icons.place_outlined, size: 14, color: Colors.grey),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(item['inspection_address'], style: const TextStyle(fontSize: 11, color: Colors.black54), overflow: TextOverflow.ellipsis),
                ),
              ],
            ),
            const Divider(height: 20),

            // Action Buttons Row (Min 48dp touch target)
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size(0, AppTheme.minTouchTargetSize),
                      padding: EdgeInsets.zero,
                    ),
                    icon: const Icon(Icons.checklist, size: 16),
                    label: const Text('Checklist', style: TextStyle(fontSize: 12)),
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => InspectionChecklistScreen(
                            caseData: item,
                            syncEngine: widget.syncEngine,
                            databaseHelper: widget.databaseHelper,
                          ),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size(0, AppTheme.minTouchTargetSize),
                      padding: EdgeInsets.zero,
                    ),
                    icon: const Icon(Icons.camera_alt, size: 16, color: AppTheme.primaryBlue),
                    label: const Text('Camera', style: TextStyle(fontSize: 12)),
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => CameraEvidenceScreen(
                            caseData: item,
                            databaseHelper: widget.databaseHelper,
                          ),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size(0, AppTheme.minTouchTargetSize),
                      padding: EdgeInsets.zero,
                    ),
                    icon: const Icon(Icons.tire_repair, size: 16, color: AppTheme.amberWarning),
                    label: const Text('Tyres', style: TextStyle(fontSize: 12)),
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => TyreInspectionScreen(
                            caseData: item,
                            databaseHelper: widget.databaseHelper,
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
