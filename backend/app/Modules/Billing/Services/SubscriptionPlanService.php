<?php

namespace App\Modules\Billing\Services;

class SubscriptionPlanService
{
    /**
     * Supported subscription plans and their tier characteristics.
     */
    protected static array $plans = [
        'STARTER' => [
            'code' => 'STARTER',
            'name' => 'Starter Pack',
            'monthly_fee_paise' => 499900, // ₹4,999 / mo
            'included_monthly_lookups' => 100,
            'credit_rate_paise' => 1800, // ₹18 / credit
            'max_users' => 5,
            'features' => [
                'Basic Vehicle Registry Lookup',
                'Single-axle Tyre Assessment',
                'Standard Email Support',
            ],
        ],
        'PROFESSIONAL' => [
            'code' => 'PROFESSIONAL',
            'name' => 'Professional Surveyor Hub',
            'monthly_fee_paise' => 1499900, // ₹14,999 / mo
            'included_monthly_lookups' => 500,
            'credit_rate_paise' => 1500, // ₹15 / credit
            'max_users' => 25,
            'features' => [
                'Live APISathi + Parivahan Ingestion',
                'Document OCR Smart Card Verification',
                'Multi-Axle Tipper Assessment (AC-TYRE-01)',
                'Priority 24h SLA Dispatch',
            ],
        ],
        'ENTERPRISE' => [
            'code' => 'ENTERPRISE',
            'name' => 'Enterprise Syndicated Suite',
            'monthly_fee_paise' => 3999900, // ₹39,999 / mo
            'included_monthly_lookups' => 2500,
            'credit_rate_paise' => 1200, // ₹12 / credit
            'max_users' => 999999, // Unlimited
            'features' => [
                'All Professional Tier Capabilities',
                'Two-Phase Credit Reservation Pool',
                'Automated Bulk Verification',
                'Dedicated Banking SLA (12h)',
                'Institutional Rate Cards & Custom Disclaimers',
            ],
        ],
    ];

    /**
     * Provider COGS unit tariffs (minor currency units in Paise).
     */
    protected static array $providerTariffs = [
        'apisathi_rc_v1' => 450, // ₹4.50
        'echallan_parivahan' => 250, // ₹2.50
        'fastag_toll_intel' => 150, // ₹1.50
        'document_ocr' => 200, // ₹2.00
    ];

    public function getPlans(): array
    {
        return array_values(self::$plans);
    }

    public function getPlan(string $code): ?array
    {
        return self::$plans[strtoupper($code)] ?? null;
    }

    public function getProviderCostPaise(string $providerCode): int
    {
        return self::$providerTariffs[$providerCode] ?? 0;
    }
}
