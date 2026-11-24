import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/encrypted_database.dart';
import '../../../core/sync/sync_outbox_engine.dart';
import '../../../core/theme/app_theme.dart';
import '../../cases/presentation/assigned_cases_screen.dart';
import '../../vehicle_lookup/presentation/vehicle_lookup_screen.dart';
import '../../sync/presentation/sync_outbox_screen.dart';
import '../../reports/presentation/mobile_report_viewer_screen.dart';
import '../../auth/presentation/login_screen.dart';

class MainNavScreen extends StatefulWidget {
  final ApiClient apiClient;
  final String userRole;
  final String userEmail;

  const MainNavScreen({
    super.key,
    required this.apiClient,
    required this.userRole,
    required this.userEmail,
  });

  @override
  State<MainNavScreen> createState() => _MainNavScreenState();
}

class _MainNavScreenState extends State<MainNavScreen> {
  int _currentIndex = 0;
  late final EncryptedDatabaseHelper _databaseHelper;
  late final SyncOutboxEngine _syncEngine;
  bool _isOnline = true;

  @override
  void initState() {
    super.initState();
    _databaseHelper = EncryptedDatabaseHelper();
    _syncEngine = SyncOutboxEngine(
      databaseHelper: _databaseHelper,
      apiClient: widget.apiClient,
    );
  }

  void _toggleConnectivity() {
    setState(() {
      _isOnline = !_isOnline;
      _syncEngine.isOnline = _isOnline;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(_isOnline ? 'Online Mode Connected' : 'Offline Mode: Changes will queue to Encrypted SQLite'),
        backgroundColor: _isOnline ? AppTheme.tealSuccess : AppTheme.amberWarning,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _logout() {
    widget.apiClient.clearSession();
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => LoginScreen(apiClient: widget.apiClient)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final screens = [
      AssignedCasesScreen(
        apiClient: widget.apiClient,
        syncEngine: _syncEngine,
        databaseHelper: _databaseHelper,
      ),
      VehicleLookupScreen(
        apiClient: widget.apiClient,
        databaseHelper: _databaseHelper,
      ),
      SyncOutboxScreen(
        syncEngine: _syncEngine,
        databaseHelper: _databaseHelper,
      ),
      MobileReportViewerScreen(
        apiClient: widget.apiClient,
      ),
    ];

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'VahanCheck Enterprise',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            Text(
              '${widget.userRole} | ${widget.userEmail}',
              style: const TextStyle(fontSize: 10, color: Colors.white70),
            ),
          ],
        ),
        actions: [
          // Online / Offline Switcher Pill
          InkWell(
            onTap: _toggleConnectivity,
            borderRadius: BorderRadius.circular(12),
            child: Container(
              margin: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: _isOnline ? AppTheme.tealSuccess.withOpacity(0.2) : AppTheme.amberWarning.withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: _isOnline ? AppTheme.tealSuccess : AppTheme.amberWarning),
              ),
              child: Row(
                children: [
                  Icon(
                    _isOnline ? Icons.wifi : Icons.wifi_off,
                    size: 14,
                    color: _isOnline ? AppTheme.tealSuccess : AppTheme.amberWarning,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    _isOnline ? 'Online' : 'Offline',
                    style: TextStyle(
                      color: _isOnline ? AppTheme.tealSuccess : AppTheme.amberWarning,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.logout, size: 20),
            onPressed: _logout,
            tooltip: 'Logout',
          ),
        ],
      ),
      body: screens[_currentIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) => setState(() => _currentIndex = index),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.assignment_outlined),
            selectedIcon: Icon(Icons.assignment),
            label: 'Cases',
          ),
          NavigationDestination(
            icon: Icon(Icons.search_outlined),
            selectedIcon: Icon(Icons.search),
            label: 'Lookup',
          ),
          NavigationDestination(
            icon: Icon(Icons.sync_outlined),
            selectedIcon: Icon(Icons.sync),
            label: 'Outbox',
          ),
          NavigationDestination(
            icon: Icon(Icons.description_outlined),
            selectedIcon: Icon(Icons.description),
            label: 'Reports',
          ),
        ],
      ),
    );
  }
}
