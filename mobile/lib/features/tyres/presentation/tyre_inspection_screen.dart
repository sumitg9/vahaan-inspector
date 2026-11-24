import 'package:flutter/material.dart';
import '../../../core/storage/encrypted_database.dart';
import '../../../core/theme/app_theme.dart';

class TyreInspectionScreen extends StatefulWidget {
  final Map<String, dynamic> caseData;
  final EncryptedDatabaseHelper databaseHelper;

  const TyreInspectionScreen({
    super.key,
    required this.caseData,
    required this.databaseHelper,
  });

  @override
  State<TyreInspectionScreen> createState() => _TyreInspectionScreenState();
}

class _TyreInspectionScreenState extends State<TyreInspectionScreen> {
  // AC-TYRE-01: Position-accurate tyre matrix for commercial 3-axle tipper (10 road + 1 spare)
  final List<Map<String, dynamic>> _tyres = [
    {'pos': 'FL', 'label': 'Front Steer Left (FL)', 'brand': 'Apollo EnduRace RA', 'size': '295/90 R20', 'depth': 8.4, 'life': 75, 'cond': 'GOOD'},
    {'pos': 'FR', 'label': 'Front Steer Right (FR)', 'brand': 'Apollo EnduRace RA', 'size': '295/90 R20', 'depth': 8.1, 'life': 72, 'cond': 'GOOD'},
    {'pos': 'A2_LO', 'label': 'Axle 2 Left Outer', 'brand': 'MRF Super Lug 50', 'size': '295/90 R20', 'depth': 6.8, 'life': 60, 'cond': 'GOOD'},
    {'pos': 'A2_LI', 'label': 'Axle 2 Left Inner', 'brand': 'MRF Super Lug 50', 'size': '295/90 R20', 'depth': 6.5, 'life': 58, 'cond': 'GOOD'},
    {'pos': 'A2_RI', 'label': 'Axle 2 Right Inner', 'brand': 'MRF Super Lug 50', 'size': '295/90 R20', 'depth': 6.2, 'life': 55, 'cond': 'GOOD'},
    {'pos': 'A2_RO', 'label': 'Axle 2 Right Outer', 'brand': 'MRF Super Lug 50', 'size': '295/90 R20', 'depth': 6.4, 'life': 57, 'cond': 'GOOD'},
    {'pos': 'A3_LO', 'label': 'Axle 3 Left Outer', 'brand': 'CEAT WinSuper X3', 'size': '295/90 R20', 'depth': 5.2, 'life': 45, 'cond': 'FAIR'},
    {'pos': 'A3_LI', 'label': 'Axle 3 Left Inner', 'brand': 'CEAT WinSuper X3', 'size': '295/90 R20', 'depth': 5.0, 'life': 42, 'cond': 'FAIR'},
    {'pos': 'A3_RI', 'label': 'Axle 3 Right Inner', 'brand': 'CEAT WinSuper X3', 'size': '295/90 R20', 'depth': 4.8, 'life': 40, 'cond': 'FAIR'},
    // AC-TYRE-02 Worn out tyre (< 1.6 mm)
    {'pos': 'A3_RO', 'label': 'Axle 3 Right Outer', 'brand': 'CEAT WinSuper X3', 'size': '295/90 R20', 'depth': 1.4, 'life': 10, 'cond': 'WORN_OUT'},
    {'pos': 'SPARE', 'label': 'Spare Wheel Carrier', 'brand': 'JK Tyre Jet R Miles', 'size': '295/90 R20', 'depth': 9.2, 'life': 85, 'cond': 'GOOD'},
  ];

  int _selectedWheelIndex = 9; // Focus on the worn tyre by default

  void _updateTreadDepth(double val) {
    setState(() {
      final rounded = double.parse(val.toStringAsFixed(1));
      _tyres[_selectedWheelIndex]['depth'] = rounded;

      // AC-TYRE-02 Legal safety threshold invariant: < 1.6 mm must be WORN_OUT
      if (rounded < 1.6) {
        _tyres[_selectedWheelIndex]['cond'] = 'WORN_OUT';
        _tyres[_selectedWheelIndex]['life'] = (rounded / 15.0 * 100).clamp(0, 15).toInt();
      } else if (rounded < 5.0) {
        _tyres[_selectedWheelIndex]['cond'] = 'FAIR';
        _tyres[_selectedWheelIndex]['life'] = (rounded / 12.0 * 100).clamp(16, 50).toInt();
      } else {
        _tyres[_selectedWheelIndex]['cond'] = 'GOOD';
        _tyres[_selectedWheelIndex]['life'] = (rounded / 12.0 * 100).clamp(51, 100).toInt();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final selectedTyre = _tyres[_selectedWheelIndex];
    final isCriticalAlert = (selectedTyre['depth'] as double) < 1.6;

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Tyres: ${widget.caseData['vehicle_reg']}'),
            const Text('3-Axle 10-Wheeler Tipper Audit', style: TextStyle(fontSize: 10, color: Colors.white70)),
          ],
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // AC-TYRE-02 Safety Alert Callout
            if (isCriticalAlert)
              Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.redAlert.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppTheme.redAlert),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.warning, color: AppTheme.redAlert, size: 24),
                    SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'AC-TYRE-02 Safety Threshold Breach: Tread depth < 1.6 mm violates CMV Rule 95. Condition forced to WORN_OUT.',
                        style: TextStyle(color: AppTheme.redAlert, fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
              ),

            // Active Wheel Editor Card
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.between,
                      children: [
                        Text(
                          selectedTyre['label'],
                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.darkNavy),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: isCriticalAlert ? AppTheme.redAlert.withOpacity(0.12) : AppTheme.tealSuccess.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            selectedTyre['cond'],
                            style: TextStyle(
                              color: isCriticalAlert ? AppTheme.redAlert : AppTheme.tealSuccess,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text('${selectedTyre['brand']} • ${selectedTyre['size']}', style: const TextStyle(fontSize: 12, color: Colors.black54)),
                    const Divider(height: 24),

                    // Tread Depth Gauge
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Measured Tread Depth (mm):', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                        Text(
                          '${selectedTyre['depth']} mm',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: isCriticalAlert ? AppTheme.redAlert : AppTheme.primaryBlue,
                          ),
                        ),
                      ],
                    ),
                    Slider(
                      value: (selectedTyre['depth'] as double).clamp(0.5, 14.0),
                      min: 0.5,
                      max: 14.0,
                      divisions: 135,
                      label: '${selectedTyre['depth']} mm',
                      activeColor: isCriticalAlert ? AppTheme.redAlert : AppTheme.primaryBlue,
                      onChanged: _updateTreadDepth,
                    ),

                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Estimated Remaining Life:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                        Text('${selectedTyre['life']}%', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 14),

            // Wheel Selector Grid
            const Text(
              'Select Wheel Position (10 Road Wheels + Spare):',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.darkNavy),
            ),
            const SizedBox(height: 8),

            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: List.generate(_tyres.length, (idx) {
                final t = _tyres[idx];
                final isSelected = _selectedWheelIndex == idx;
                final isWorn = (t['depth'] as double) < 1.6;

                return InkWell(
                  onTap: () => setState(() => _selectedWheelIndex = idx),
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    width: 78,
                    height: AppTheme.minTouchTargetSize,
                    decoration: BoxDecoration(
                      color: isSelected
                          ? AppTheme.primaryBlue
                          : isWorn
                              ? AppTheme.redAlert.withOpacity(0.1)
                              : Colors.white,
                      border: Border.all(
                        color: isSelected
                            ? AppTheme.primaryBlue
                            : isWorn
                                ? AppTheme.redAlert
                                : Colors.grey.shade300,
                        width: isSelected ? 2 : 1,
                      ),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            t['pos'],
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: isSelected
                                  ? Colors.white
                                  : isWorn
                                      ? AppTheme.redAlert
                                      : AppTheme.darkNavy,
                            ),
                          ),
                          Text(
                            '${t['depth']}mm',
                            style: TextStyle(
                              fontSize: 9,
                              color: isSelected
                                  ? Colors.white70
                                  : isWorn
                                      ? AppTheme.redAlert
                                      : Colors.grey,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }),
            ),
          ],
        ),
      ),
    );
  }
}
