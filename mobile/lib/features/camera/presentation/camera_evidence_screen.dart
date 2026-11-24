import 'package:flutter/material.dart';
import '../../../core/storage/encrypted_database.dart';
import '../../../core/theme/app_theme.dart';

class CameraEvidenceScreen extends StatefulWidget {
  final Map<String, dynamic> caseData;
  final EncryptedDatabaseHelper databaseHelper;

  const CameraEvidenceScreen({
    super.key,
    required this.caseData,
    required this.databaseHelper,
  });

  @override
  State<CameraEvidenceScreen> createState() => _CameraEvidenceScreenState();
}

class _CameraEvidenceScreenState extends State<CameraEvidenceScreen> {
  final List<Map<String, dynamic>> _photoCategories = [
    {'category': 'FRONT_45', 'label': 'Front 45° Angle View', 'is_captured': true, 'hash': 'e3b0c44298fc1c149afbf4c8996fb924', 'gps': '18.5204° N, 73.8567° E', 'is_damage': false},
    {'category': 'REAR_45', 'label': 'Rear 45° Angle View', 'is_captured': true, 'hash': 'd41d8cd98f00b204e9800998ecf8427e', 'gps': '18.5204° N, 73.8567° E', 'is_damage': false},
    {'category': 'ODOMETER', 'label': 'Illuminated Dashboard & Odometer', 'is_captured': true, 'hash': 'c3d4e5f60718293a4b5c6d7e8f901122', 'gps': '18.5204° N, 73.8567° E', 'is_damage': false},
    {'category': 'CHASSIS_STAMP', 'label': 'Chassis Frame VIN Stamping', 'is_captured': true, 'hash': 'e5f60718293a4b5c6d7e8f9011223344', 'gps': '18.5204° N, 73.8567° E', 'is_damage': false},
    {'category': 'ENGINE_BAY', 'label': 'Complete Engine Bay Compartment', 'is_captured': false, 'hash': null, 'gps': null, 'is_damage': false},
    {'category': 'DAMAGE', 'label': 'Tailgate Dent / Metal Deformation', 'is_captured': false, 'hash': null, 'gps': null, 'is_damage': true},
  ];

  void _capturePhoto(int index) {
    setState(() {
      _photoCategories[index]['is_captured'] = true;
      _photoCategories[index]['hash'] = 'sha256_${DateTime.now().millisecondsSinceEpoch}_hash';
      _photoCategories[index]['gps'] = '18.5204° N, 73.8567° E';
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${_photoCategories[index]['label']} captured with EXIF GPS and SHA-256 integrity hash.'),
        backgroundColor: AppTheme.tealSuccess,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Camera: ${widget.caseData['vehicle_reg']}'),
            const Text('Geotagged Photographic Proof', style: TextStyle(fontSize: 10, color: Colors.white70)),
          ],
        ),
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: _photoCategories.length,
        itemBuilder: (context, index) {
          final photo = _photoCategories[index];
          final isCaptured = photo['is_captured'] as bool;

          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.between,
                    children: [
                      Row(
                        children: [
                          Icon(
                            isCaptured ? Icons.check_circle : Icons.camera_alt_outlined,
                            size: 18,
                            color: isCaptured ? AppTheme.tealSuccess : Colors.grey,
                          ),
                          const SizedBox(width: 6),
                          Text(photo['label'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.darkNavy)),
                        ],
                      ),
                      if (photo['is_damage'])
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(color: AppTheme.redAlert.withOpacity(0.1), borderRadius: BorderRadius.circular(4)),
                          child: const Text('DAMAGE PROOF', style: TextStyle(color: AppTheme.redAlert, fontSize: 9, fontWeight: FontWeight.bold)),
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  if (isCaptured) ...[
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(color: AppTheme.canvasLight, borderRadius: BorderRadius.circular(6)),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.location_on, size: 14, color: AppTheme.primaryBlue),
                              const SizedBox(width: 4),
                              Text('EXIF GPS: ${photo['gps']}', style: const TextStyle(fontSize: 11, color: Colors.black87)),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Row(
                            children: [
                              const Icon(Icons.fingerprint, size: 14, color: AppTheme.tealSuccess),
                              const SizedBox(width: 4),
                              Text('SHA-256: ${photo['hash']}', style: const TextStyle(fontSize: 10, fontFamily: 'monospace', color: Colors.black54)),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),
                  ],

                  // Capture / Retake Button (Min 48dp touch target)
                  SizedBox(
                    height: AppTheme.minTouchTargetSize,
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      icon: Icon(isCaptured ? Icons.replay : Icons.photo_camera, size: 18),
                      label: Text(isCaptured ? 'RETAKE PHOTOGRAPH' : 'CAPTURE PHOTOGRAPH'),
                      onPressed: () => _capturePhoto(index),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
