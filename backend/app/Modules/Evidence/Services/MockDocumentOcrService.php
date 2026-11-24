<?php

namespace App\Modules\Evidence\Services;

class MockDocumentOcrService implements DocumentOcrServiceInterface
{
    /**
     * Deterministic OCR extraction fixtures.
     */
    public function extractDocumentData(string $documentType, string $s3Key, array $options = []): array
    {
        $docType = strtoupper(trim($documentType));
        $simulatedScenario = $options['scenario'] ?? 'standard';

        switch ($docType) {
            case 'RC_SMART_CARD':
            case 'RC':
                if ($simulatedScenario === 'discrepancy') {
                    return [
                        'document_type' => 'RC_SMART_CARD',
                        'confidence_score' => 0.94,
                        'extracted_fields' => [
                            'registration_number' => 'MH12AB1234',
                            'chassis_number' => 'MAT621045K8Z99999', // Mismatched chassis number!
                            'engine_number' => '497TC92XYZ11111',
                            'registered_owner' => 'KUMAR TRANSPORTS PVT LTD',
                            'maker_model' => 'TATA PRIMA 2830.K',
                            'vehicle_class' => 'HGV',
                            'fuel_type' => 'DIESEL',
                            'registration_date' => '2021-06-15',
                            'fitness_upto' => '2025-06-14',
                        ],
                        'raw_text' => "TRANSPORT DEPARTMENT MAHARASHTRA\nRC NO: MH12AB1234\nCHASSIS: MAT621045K8Z99999\nENGINE: 497TC92XYZ11111\nOWNER: KUMAR TRANSPORTS PVT LTD",
                        'ocr_engine' => 'MockOcrV2-Vision',
                        'processed_at' => date('Y-m-d H:i:s'),
                    ];
                }

                return [
                    'document_type' => 'RC_SMART_CARD',
                    'confidence_score' => 0.98,
                    'extracted_fields' => [
                        'registration_number' => 'MH12AB1234',
                        'chassis_number' => 'MAT621045K8Z12345',
                        'engine_number' => '497TC92XYZ56789',
                        'registered_owner' => 'M/S LOGISTICS INDIA PRIVATE LIMITED',
                        'maker_model' => 'TATA PRIMA 2830.K',
                        'vehicle_class' => 'HGV',
                        'fuel_type' => 'DIESEL',
                        'registration_date' => '2021-06-15',
                        'fitness_upto' => '2028-06-14',
                    ],
                    'raw_text' => "TRANSPORT DEPARTMENT MAHARASHTRA\nRC NO: MH12AB1234\nCHASSIS: MAT621045K8Z12345\nENGINE: 497TC92XYZ56789\nOWNER: M/S LOGISTICS INDIA PRIVATE LIMITED",
                    'ocr_engine' => 'MockOcrV2-Vision',
                    'processed_at' => date('Y-m-d H:i:s'),
                ];

            case 'INSURANCE_POLICY':
                $isExpired = ($simulatedScenario === 'expired');
                return [
                    'document_type' => 'INSURANCE_POLICY',
                    'confidence_score' => 0.96,
                    'extracted_fields' => [
                        'policy_number' => 'OG-26-1102-1801-00045678',
                        'insurance_company' => 'ICICI LOMBARD GENERAL INSURANCE',
                        'registration_number' => 'MH12AB1234',
                        'policy_type' => 'COMPREHENSIVE_COMMERCIAL',
                        'idv_inr' => 2450000,
                        'valid_from' => $isExpired ? '2024-03-01' : '2026-03-01',
                        'valid_upto' => $isExpired ? '2025-02-28' : '2027-02-28', // Expired if scenario=expired
                        'insured_name' => 'M/S LOGISTICS INDIA PRIVATE LIMITED',
                    ],
                    'raw_text' => "CERTIFICATE OF INSURANCE\nPOLICY: OG-26-1102-1801-00045678\nINSURED: M/S LOGISTICS INDIA PVT LTD\nREG NO: MH12AB1234",
                    'ocr_engine' => 'MockOcrV2-Vision',
                    'processed_at' => date('Y-m-d H:i:s'),
                ];

            case 'PUC_CERTIFICATE':
                return [
                    'document_type' => 'PUC_CERTIFICATE',
                    'confidence_score' => 0.95,
                    'extracted_fields' => [
                        'certificate_number' => 'MH01200340008912',
                        'registration_number' => 'MH12AB1234',
                        'valid_upto' => '2026-12-31',
                        'smoke_density_percentage' => 42.5,
                        'emission_standard' => 'BS VI',
                    ],
                    'raw_text' => "POLLUTION UNDER CONTROL CERTIFICATE\nMH12AB1234\nVALID UPTO: 31/12/2026",
                    'ocr_engine' => 'MockOcrV2-Vision',
                    'processed_at' => date('Y-m-d H:i:s'),
                ];

            default:
                return [
                    'document_type' => $docType,
                    'confidence_score' => 0.90,
                    'extracted_fields' => [
                        'registration_number' => 'MH12AB1234',
                        'document_identifier' => 'DOC-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6)),
                    ],
                    'raw_text' => "GENERIC MOTOR VEHICLE DOCUMENT\nREG NO: MH12AB1234",
                    'ocr_engine' => 'MockOcrV2-Vision',
                    'processed_at' => date('Y-m-d H:i:s'),
                ];
        }
    }
}
