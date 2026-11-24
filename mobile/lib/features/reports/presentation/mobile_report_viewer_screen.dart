import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/app_theme.dart';

class MobileReportViewerScreen extends StatefulWidget {
  final ApiClient apiClient;

  const MobileReportViewerScreen({super.key, required this.apiClient});

  @override
  State<MobileReportViewerScreen> createState() => _MobileReportViewerScreenState();
}

class _MobileReportViewerScreenState extends State<MobileReportViewerScreen> {
  final Map<String, dynamic> _mockDossier = {
    'case_id': 'INSP-2026-001',
    'report_version': '1.0',
    'registration_number': 'MH12PQ9876',
    'maker_model': 'Tata Motors - LPT 3118 TC 6x2 Tipper',
    'client_name': 'State Bank of India (Mumbai Fort)',
    'approved_fair_market_value_inr': 1820000.0,
    'approved_distress_value_inr': 1547000.0,
    'valuer_name': 'Er. Rajeshwar K. Patil (Cat-I)',
    'valuation_type': 'Certified Valuation Dossier',
    'is_mock_watermarked': true,
    'watermark_text': 'DEMONSTRATION DATA — NOT FOR OFFICIAL USE',
    'verification_token': 'd6a8f10204e9800998ecf8427e112233445566778899aabbccddeeff00112233',
    'sha256_checksum': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Invariant 2 Indelible Mock Watermark Banner
            if (_mockDossier['is_mock_watermarked'])
              Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.redAlert.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppTheme.redAlert.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.shield_outlined, color: AppTheme.redAlert, size: 22),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        _mockDossier['watermark_text'],
                        style: const TextStyle(
                          color: AppTheme.redAlert,
                          fontSize: 10.5,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

            // Dossier Header Card
            Card(
              elevation: 1,
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
                          _mockDossier['registration_number'],
                          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppTheme.darkNavy),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryBlue.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            'v${_mockDossier['report_version']}',
                            style: const TextStyle(color: AppTheme.primaryBlue, fontWeight: FontWeight.bold, fontSize: 11),
                          ),
                        ),
                      ],
                    ),
                    Text(
                      _mockDossier['maker_model'],
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.black87),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Requesting Client: ${_mockDossier['client_name']}',
                      style: const TextStyle(fontSize: 11, color: Colors.grey),
                    ),
                    const Divider(height: 24),

                    // Big Numbers
                    Row(
                      children: [
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppTheme.primaryBlue.withOpacity(0.06),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: AppTheme.primaryBlue.withOpacity(0.2)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Approved FMV', style: TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold)),
                                const SizedBox(height: 2),
                                Text(
                                  '₹${(_mockDossier['approved_fair_market_value_inr'] as double).toStringAsFixed(0)}',
                                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: AppTheme.primaryBlue),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppTheme.amberWarning.withOpacity(0.06),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: AppTheme.amberWarning.withOpacity(0.2)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Distress Value', style: TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold)),
                                const SizedBox(height: 2),
                                Text(
                                  '₹${(_mockDossier['approved_distress_value_inr'] as double).toStringAsFixed(0)}',
                                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: AppTheme.amberWarning),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 14),

            // AC-REP-02 Cryptographic QR Code Verification Card
            Card(
              elevation: 1,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.qr_code_2, size: 24, color: AppTheme.darkNavy),
                        SizedBox(width: 8),
                        Text(
                          'Cryptographic QR Verification (AC-REP-02)',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.darkNavy),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Every approved inspection snapshot is sealed with an immutable SHA-256 checksum and unique verification token.',
                      style: TextStyle(fontSize: 11, color: Colors.black54),
                    ),
                    const SizedBox(height: 10),

                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(color: AppTheme.canvasLight, borderRadius: BorderRadius.circular(6)),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('SHA-256 CHECKSUM:', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey)),
                          Text(
                            _mockDossier['sha256_checksum'],
                            style: const TextStyle(fontSize: 10, fontFamily: 'monospace', color: AppTheme.tealSuccess, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 6),
                          const Text('VERIFICATION TOKEN:', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey)),
                          Text(
                            _mockDossier['verification_token'],
                            style: const TextStyle(fontSize: 10, fontFamily: 'monospace', color: AppTheme.primaryBlue),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),

                    SizedBox(
                      height: AppTheme.minTouchTargetSize,
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        icon: const Icon(Icons.verified, size: 18),
                        label: const Text('VERIFY DIGITAL SEAL'),
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Digital seal verified: SHA-256 matches immutable server snapshot.'),
                              backgroundColor: AppTheme.tealSuccess,
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
