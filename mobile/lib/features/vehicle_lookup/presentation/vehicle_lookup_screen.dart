import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/encrypted_database.dart';
import '../../../core/theme/app_theme.dart';

class VehicleLookupScreen extends StatefulWidget {
  final ApiClient apiClient;
  final EncryptedDatabaseHelper databaseHelper;

  const VehicleLookupScreen({
    super.key,
    required this.apiClient,
    required this.databaseHelper,
  });

  @override
  State<VehicleLookupScreen> createState() => _VehicleLookupScreenState();
}

class _VehicleLookupScreenState extends State<VehicleLookupScreen> {
  final _regController = TextEditingController(text: 'MH12PQ9876');
  bool _isLoading = false;
  Map<String, dynamic>? _vehicleData;
  bool _isFromOfflineCache = false;

  void _searchVehicle() async {
    final reg = _regController.text.trim().toUpperCase();
    if (reg.isEmpty) return;

    setState(() {
      _isLoading = true;
      _vehicleData = null;
      _isFromOfflineCache = false;
    });

    // Check offline encrypted cache first
    final cached = await widget.databaseHelper.getCachedVehicle(reg);
    if (cached != null) {
      setState(() {
        _vehicleData = cached;
        _isFromOfflineCache = true;
        _isLoading = false;
      });
      return;
    }

    // Simulate backend lookup
    await Future.delayed(const Duration(milliseconds: 400));

    final result = {
      'registration_number': reg,
      'registered_owner_masked': 'M**** S**** LOGISTICS LLP', // DPDP Act Invariant 7
      'maker_model': 'Tata Motors LPT 3118 TC 6x2 Tipper',
      'vehicle_class': 'Heavy Goods Vehicle (HGV)',
      'body_type': 'Full Metal Open Tipper',
      'fuel_type': 'DIESEL',
      'emission_norms': 'BS-VI',
      'rto_authority': 'MH-12 Pune RTO, Maharashtra',
      'chassis_number': 'MAT842109N3K*****',
      'engine_number': '697TC54K******',
      'registration_date': '2022-06-15',
      'fitness_valid_until': '2028-06-14',
      'insurance_valid_until': '2027-06-14',
      'insurance_company': 'New India Assurance Co. Ltd.',
      'tax_valid_until': '2027-03-31',
      'pucc_valid_until': '2027-05-10',
      'financier_name': 'Tata Motors Finance Limited',
      'hypothecation_status': 'HYPOTHECATED',
      'blacklist_status': 'CLEAN (No NCRB Records)',
      'challans_summary': {
        'pending_count': 2,
        'pending_fines_inr': 3500.0,
      },
    };

    // Store in offline cache
    await widget.databaseHelper.cacheVehicle(reg, result);

    if (mounted) {
      setState(() {
        _vehicleData = result;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Search Input Card
            Card(
              elevation: 1,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(14.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text(
                      'National Vehicle Registry Lookup (VAHAN & eChallan)',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.darkNavy),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _regController,
                            textCapitalization: TextCapitalization.characters,
                            decoration: InputDecoration(
                              hintText: 'e.g. MH12PQ9876',
                              prefixIcon: const Icon(Icons.directions_car, color: AppTheme.primaryBlue),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        SizedBox(
                          height: AppTheme.minTouchTargetSize,
                          child: ElevatedButton(
                            onPressed: _isLoading ? null : _searchVehicle,
                            child: _isLoading
                                ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                : const Text('VERIFY'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Results Display
            if (_vehicleData != null) ...[
              if (_isFromOfflineCache)
                Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppTheme.amberWarning.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppTheme.amberWarning),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.offline_pin, size: 16, color: AppTheme.amberWarning),
                      SizedBox(width: 6),
                      Text('Loaded from Encrypted SQLite Offline Cache', style: TextStyle(color: AppTheme.amberWarning, fontSize: 11, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),

              Card(
                elevation: 1,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header Row
                      Row(
                        mainAxisAlignment: MainAxisAlignment.between,
                        children: [
                          Text(
                            _vehicleData!['registration_number'],
                            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppTheme.darkNavy),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppTheme.tealSuccess.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(color: AppTheme.tealSuccess),
                            ),
                            child: const Text('VERIFIED', style: TextStyle(color: AppTheme.tealSuccess, fontWeight: FontWeight.bold, fontSize: 10)),
                          ),
                        ],
                      ),
                      Text(
                        _vehicleData!['maker_model'],
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.black87),
                      ),
                      const Divider(height: 24),

                      // Attributes
                      _buildAttrRow('Registered Owner (DPDP):', _vehicleData!['registered_owner_masked']),
                      _buildAttrRow('Vehicle Class:', _vehicleData!['vehicle_class']),
                      _buildAttrRow('Body Type:', _vehicleData!['body_type']),
                      _buildAttrRow('Fuel & Norms:', '${_vehicleData!['fuel_type']} (${_vehicleData!['emission_norms']})'),
                      _buildAttrRow('Chassis / VIN:', _vehicleData!['chassis_number']),
                      _buildAttrRow('Engine Number:', _vehicleData!['engine_number']),
                      _buildAttrRow('RTO Authority:', _vehicleData!['rto_authority']),
                      _buildAttrRow('Fitness Validity:', _vehicleData!['fitness_valid_until'], isPass: true),
                      _buildAttrRow('Insurance Upto:', _vehicleData!['insurance_valid_until']),
                      _buildAttrRow('Hypothecation:', '${_vehicleData!['hypothecation_status']} to ${_vehicleData!['financier_name']}'),

                      const SizedBox(height: 12),
                      // Challans Box
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppTheme.redAlert.withOpacity(0.06),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppTheme.redAlert.withOpacity(0.3)),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.between,
                          children: [
                            const Row(
                              children: [
                                Icon(Icons.warning_amber_rounded, color: AppTheme.redAlert, size: 20),
                                SizedBox(width: 8),
                                Text('Traffic Challan Liability:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                              ],
                            ),
                            Text(
                              '${_vehicleData!['challans_summary']['pending_count']} Pending (₹${_vehicleData!['challans_summary']['pending_fines_inr']})',
                              style: const TextStyle(fontWeight: FontWeight.w900, color: AppTheme.redAlert, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildAttrRow(String label, String value, {bool isPass = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 130,
            child: Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.w500)),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: isPass ? AppTheme.tealSuccess : AppTheme.darkNavy,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
