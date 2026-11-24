<?php

namespace App\Modules\Evidence\Services;

class DocumentComparisonService
{
    /**
     * Compare OCR extracted document fields with canonical VAHAN registry record.
     */
    public function compareDocumentWithRegistry(array $extractedFields, array $canonicalProfile): array
    {
        $fieldComparisons = [];
        $discrepancies = [];
        $totalWeight = 0;
        $matchedWeight = 0;

        // 1. Registration Number (Weight: 30)
        $docReg = strtoupper(preg_replace('/[^A-Z0-9]/', '', $extractedFields['registration_number'] ?? ''));
        $regReg = strtoupper(preg_replace('/[^A-Z0-9]/', '', $canonicalProfile['registration_number'] ?? ''));
        $totalWeight += 30;

        if ($docReg && $regReg && $docReg === $regReg) {
            $matchedWeight += 30;
            $fieldComparisons['registration_number'] = [
                'document_value' => $extractedFields['registration_number'],
                'registry_value' => $canonicalProfile['registration_number'],
                'status' => 'EXACT_MATCH',
            ];
        } else {
            $fieldComparisons['registration_number'] = [
                'document_value' => $extractedFields['registration_number'] ?? 'NOT_DETECTED',
                'registry_value' => $canonicalProfile['registration_number'] ?? 'UNAVAILABLE',
                'status' => 'MISMATCH',
            ];
            $discrepancies[] = "Registration number mismatch: Document reads '{$extractedFields['registration_number']}' while Registry is '{$canonicalProfile['registration_number']}'.";
        }

        // 2. Chassis / VIN Number (Weight: 25)
        if (!empty($extractedFields['chassis_number'])) {
            $totalWeight += 25;
            $docVin = strtoupper(preg_replace('/[^A-Z0-9]/', '', $extractedFields['chassis_number']));
            $regVin = strtoupper(preg_replace('/[^A-Z0-9]/', '', $canonicalProfile['chassis_number'] ?? $canonicalProfile['vin'] ?? ''));

            // Check if full match or visible suffix matches (e.g. last 5 digits)
            $docSuffix = substr($docVin, -5);
            $regSuffix = substr($regVin, -5);

            if ($docVin === $regVin || ($docSuffix && $regSuffix && $docSuffix === $regSuffix)) {
                $matchedWeight += 25;
                $fieldComparisons['chassis_number'] = [
                    'document_value' => $extractedFields['chassis_number'],
                    'registry_value' => $canonicalProfile['chassis_number'] ?? $canonicalProfile['vin_masked'] ?? 'MATCHED',
                    'status' => 'EXACT_MATCH',
                ];
            } else {
                $fieldComparisons['chassis_number'] = [
                    'document_value' => $extractedFields['chassis_number'],
                    'registry_value' => $canonicalProfile['chassis_number'] ?? $canonicalProfile['vin_masked'] ?? 'RESTRICTED',
                    'status' => 'MISMATCH',
                ];
                $discrepancies[] = "Chassis VIN discrepancy: Document suffix '{$docSuffix}' does not match Registry suffix '{$regSuffix}'. Potential physical tampering.";
            }
        }

        // 3. Engine Number (Weight: 20)
        if (!empty($extractedFields['engine_number'])) {
            $totalWeight += 20;
            $docEng = strtoupper(preg_replace('/[^A-Z0-9]/', '', $extractedFields['engine_number']));
            $regEng = strtoupper(preg_replace('/[^A-Z0-9]/', '', $canonicalProfile['engine_number'] ?? ''));

            $docEngSuffix = substr($docEng, -5);
            $regEngSuffix = substr($regEng, -5);

            if ($docEng === $regEng || ($docEngSuffix && $regEngSuffix && $docEngSuffix === $regEngSuffix)) {
                $matchedWeight += 20;
                $fieldComparisons['engine_number'] = [
                    'document_value' => $extractedFields['engine_number'],
                    'registry_value' => $canonicalProfile['engine_number'] ?? $canonicalProfile['engine_number_masked'] ?? 'MATCHED',
                    'status' => 'EXACT_MATCH',
                ];
            } else {
                $fieldComparisons['engine_number'] = [
                    'document_value' => $extractedFields['engine_number'],
                    'registry_value' => $canonicalProfile['engine_number'] ?? $canonicalProfile['engine_number_masked'] ?? 'RESTRICTED',
                    'status' => 'MISMATCH',
                ];
                $discrepancies[] = "Engine number mismatch: Document suffix '{$docEngSuffix}' differs from Registry '{$regEngSuffix}'.";
            }
        }

        // 4. Registered Owner Name (Weight: 15)
        if (!empty($extractedFields['registered_owner']) || !empty($extractedFields['insured_name'])) {
            $totalWeight += 15;
            $docOwner = strtoupper(trim($extractedFields['registered_owner'] ?? $extractedFields['insured_name'] ?? ''));
            $regOwner = strtoupper(trim($canonicalProfile['owner_name'] ?? $canonicalProfile['owner_name_masked'] ?? ''));

            // Standardize company abbreviations
            $normDoc = str_replace(['PRIVATE LIMITED', 'PVT LTD', 'LTD.', 'LTD', '.'], '', $docOwner);
            $normReg = str_replace(['PRIVATE LIMITED', 'PVT LTD', 'LTD.', 'LTD', '.'], '', $regOwner);

            similar_text(trim($normDoc), trim($normReg), $similarity);

            if ($similarity >= 75 || str_contains($normDoc, trim($normReg)) || str_contains($normReg, trim($normDoc))) {
                $matchedWeight += 15;
                $fieldComparisons['registered_owner'] = [
                    'document_value' => $docOwner,
                    'registry_value' => $regOwner,
                    'status' => 'EXACT_MATCH',
                ];
            } else {
                $fieldComparisons['registered_owner'] = [
                    'document_value' => $docOwner,
                    'registry_value' => $regOwner,
                    'status' => 'MISMATCH',
                ];
                $discrepancies[] = "Registered owner name divergence: Document shows '{$docOwner}' while Registry records '{$regOwner}'.";
            }
        }

        // 5. Expiration Date Check (Weight: 10)
        $expiryDate = $extractedFields['valid_upto'] ?? $extractedFields['fitness_upto'] ?? null;
        if ($expiryDate) {
            $totalWeight += 10;
            $expTimestamp = strtotime($expiryDate);
            $isExpired = $expTimestamp !== false && $expTimestamp < time();

            if (!$isExpired) {
                $matchedWeight += 10;
                $fieldComparisons['validity'] = [
                    'document_expiry' => $expiryDate,
                    'is_expired' => false,
                    'status' => 'VALID',
                ];
            } else {
                $fieldComparisons['validity'] = [
                    'document_expiry' => $expiryDate,
                    'is_expired' => true,
                    'status' => 'EXPIRED',
                ];
                $discrepancies[] = "Document is expired: Expired on {$expiryDate}.";
            }
        }

        $overallPct = $totalWeight > 0 ? (int) round(($matchedWeight / $totalWeight) * 100) : 100;

        $overallStatus = match (true) {
            $overallPct >= 90 && empty($discrepancies) => 'MATCH',
            $overallPct >= 70 => 'PARTIAL_MATCH',
            default => 'DISCREPANCY_DETECTED',
        };

        return [
            'overall_match_percentage' => $overallPct,
            'status' => $overallStatus,
            'field_comparisons' => $fieldComparisons,
            'discrepancies' => $discrepancies,
            'verified_at' => date('Y-m-d H:i:s'),
        ];
    }
}
