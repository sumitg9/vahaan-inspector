<?php

namespace App\Modules\Fleet\Services;

use DateTimeImmutable;

class ComplianceExpiryEngine
{
    public const STATUS_COMPLIANT = 'COMPLIANT';
    public const STATUS_EXPIRING_SOON = 'EXPIRING_SOON';
    public const STATUS_NON_COMPLIANT = 'NON_COMPLIANT';

    /**
     * Evaluate single statutory document expiry.
     */
    public function evaluateDocument(string $docName, ?string $validUntil, ?DateTimeImmutable $referenceDate = null): array
    {
        $ref = $referenceDate ?? new DateTimeImmutable('today');

        if (empty($validUntil)) {
            return [
                'document' => $docName,
                'valid_until' => null,
                'days_remaining' => null,
                'status' => 'UNAVAILABLE',
                'alert_level' => 'WARNING',
                'is_expired' => false,
                'is_expiring_soon' => false,
                'label' => 'Not Recorded',
            ];
        }

        try {
            $expiry = new DateTimeImmutable($validUntil);
            $diff = $ref->diff($expiry);
            $days = (int) $diff->format('%r%a');

            if ($days < 0) {
                return [
                    'document' => $docName,
                    'valid_until' => $expiry->format('Y-m-d'),
                    'days_remaining' => $days,
                    'status' => 'EXPIRED',
                    'alert_level' => 'CRITICAL',
                    'is_expired' => true,
                    'is_expiring_soon' => false,
                    'label' => 'Expired ' . abs($days) . 'd ago',
                ];
            } elseif ($days === 0) {
                return [
                    'document' => $docName,
                    'valid_until' => $expiry->format('Y-m-d'),
                    'days_remaining' => 0,
                    'status' => 'EXPIRES_TODAY',
                    'alert_level' => 'CRITICAL',
                    'is_expired' => true,
                    'is_expiring_soon' => true,
                    'label' => 'Expires Today',
                ];
            } elseif ($days <= 7) {
                return [
                    'document' => $docName,
                    'valid_until' => $expiry->format('Y-m-d'),
                    'days_remaining' => $days,
                    'status' => 'EXPIRING_7D',
                    'alert_level' => 'CRITICAL',
                    'is_expired' => false,
                    'is_expiring_soon' => true,
                    'label' => "{$days}d remaining",
                ];
            } elseif ($days <= 30) {
                return [
                    'document' => $docName,
                    'valid_until' => $expiry->format('Y-m-d'),
                    'days_remaining' => $days,
                    'status' => 'EXPIRING_30D',
                    'alert_level' => 'WARNING',
                    'is_expired' => false,
                    'is_expiring_soon' => true,
                    'label' => "{$days}d remaining",
                ];
            } else {
                return [
                    'document' => $docName,
                    'valid_until' => $expiry->format('Y-m-d'),
                    'days_remaining' => $days,
                    'status' => 'VALID',
                    'alert_level' => 'OK',
                    'is_expired' => false,
                    'is_expiring_soon' => false,
                    'label' => "Valid ({$days}d)",
                ];
            }
        } catch (\Throwable $e) {
            return [
                'document' => $docName,
                'valid_until' => $validUntil,
                'days_remaining' => null,
                'status' => 'INVALID_DATE',
                'alert_level' => 'WARNING',
                'is_expired' => false,
                'is_expiring_soon' => false,
                'label' => 'Invalid Date',
            ];
        }
    }

    /**
     * Evaluate statutory compliance dossier for a complete vehicle.
     */
    public function evaluateVehicle(array|object $vehicle, array $challans = [], ?DateTimeImmutable $referenceDate = null): array
    {
        $arr = is_array($vehicle) ? $vehicle : (method_exists($vehicle, 'toArray') ? $vehicle->toArray() : (array) $vehicle);

        // Check 5 Statutory Items
        $fitness = $this->evaluateDocument('FITNESS', $arr['fitness_valid_until'] ?? null, $referenceDate);
        $insurance = $this->evaluateDocument('INSURANCE', $arr['insurance_valid_until'] ?? null, $referenceDate);
        $pucc = $this->evaluateDocument('PUCC', $arr['pucc_valid_until'] ?? null, $referenceDate);
        $permit = $this->evaluateDocument('PERMIT', $arr['national_permit_valid_until'] ?? null, $referenceDate);
        $tax = $this->evaluateDocument('ROAD_TAX', $arr['tax_valid_until'] ?? null, $referenceDate);

        $documents = [
            'fitness' => $fitness,
            'insurance' => $insurance,
            'pucc' => $pucc,
            'permit' => $permit,
            'tax' => $tax,
        ];

        $expiredDocs = [];
        $expiringSoonDocs = [];

        foreach ($documents as $key => $doc) {
            if ($doc['is_expired']) {
                $expiredDocs[] = $doc['document'];
            } elseif ($doc['is_expiring_soon']) {
                $expiringSoonDocs[] = $doc['document'];
            }
        }

        // Determine Overall Compliance
        if (!empty($expiredDocs)) {
            $overallStatus = self::STATUS_NON_COMPLIANT;
            $statusLabel = 'Non-Compliant (' . implode(', ', $expiredDocs) . ' expired)';
            $overallAlert = 'CRITICAL';
        } elseif (!empty($expiringSoonDocs)) {
            $overallStatus = self::STATUS_EXPIRING_SOON;
            $statusLabel = 'Expiring Soon (' . implode(', ', $expiringSoonDocs) . ')';
            $overallAlert = 'WARNING';
        } else {
            $overallStatus = self::STATUS_COMPLIANT;
            $statusLabel = 'Fully Compliant';
            $overallAlert = 'OK';
        }

        // Evaluate Challans
        $pendingChallans = array_filter($challans, fn($c) => ($c['status'] ?? '') === 'PENDING');
        $pendingChallanCount = count($pendingChallans);
        $totalFinesPaise = array_sum(array_column($pendingChallans, 'fine_amount_paise'));

        // Risk Level
        $riskLevel = 'LOW';
        if ($overallStatus === self::STATUS_NON_COMPLIANT) {
            $riskLevel = $pendingChallanCount > 0 ? 'CRITICAL_RISK' : 'HIGH_RISK';
        } elseif ($overallStatus === self::STATUS_EXPIRING_SOON || $pendingChallanCount > 0) {
            $riskLevel = 'MODERATE';
        }

        return [
            'overall_status' => $overallStatus,
            'status_label' => $statusLabel,
            'overall_alert' => $overallAlert,
            'risk_level' => $riskLevel,
            'is_groundable' => $overallStatus === self::STATUS_NON_COMPLIANT,
            'documents' => $documents,
            'expired_documents' => $expiredDocs,
            'expiring_soon_documents' => $expiringSoonDocs,
            'pending_challan_count' => $pendingChallanCount,
            'total_fines_paise' => $totalFinesPaise,
            'total_fines_inr' => number_format($totalFinesPaise / 100, 2),
        ];
    }
}
