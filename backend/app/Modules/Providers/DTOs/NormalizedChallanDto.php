<?php

namespace App\Modules\Providers\DTOs;

/**
 * Standardized Data Transfer Object for an individual Traffic Challan record.
 * Uses integer minor units (Indian Paise) for strict monetary precision.
 */
class NormalizedChallanDto
{
    public function __construct(
        public readonly string $challanNumber,
        public readonly string $offenceDetails,
        public readonly string $offenceDateTime,
        public readonly int $fineAmountPaise, // 64-bit integer minor unit paise
        public readonly string $stateCode,
        public readonly ?string $rtoName,
        public readonly string $challanStatus, // PENDING, DISPOSED, SENT_TO_COURT
        public readonly ?string $courtName,
        public readonly ?string $paymentDate,
        public readonly ?string $receiptNumber,
        public readonly ?string $parivahanUrl
    ) {}

    public static function fromRaw(array $c): self
    {
        $amount = $c['amount'] ?? $c['fine_amount'] ?? 0;
        // If provided as rupees, convert to integer paise. If already in paise (e.g. > 100000 with fine_amount_paise key), keep.
        $paise = isset($c['fine_amount_paise'])
            ? (int) $c['fine_amount_paise']
            : (int) round(((float) $amount) * 100);

        $statusRaw = strtoupper($c['status'] ?? $c['challan_status'] ?? 'PENDING');
        $status = match ($statusRaw) {
            'DISPOSED', 'PAID', 'SETTLED' => 'DISPOSED',
            'SENT_TO_COURT', 'COURT' => 'SENT_TO_COURT',
            default => 'PENDING',
        };

        $challanNum = $c['challan_number'] ?? $c['challan_no'] ?? 'UNKNOWN';

        return new self(
            challanNumber: $challanNum,
            offenceDetails: $c['offence_name'] ?? $c['offence_details'] ?? 'Motor Vehicles Act violation',
            offenceDateTime: $c['challan_date'] ?? $c['offence_date_time'] ?? date('Y-m-d H:i:s'),
            fineAmountPaise: $paise,
            stateCode: $c['state'] ?? $c['state_code'] ?? 'MH',
            rtoName: $c['rto'] ?? $c['rto_name'] ?? null,
            challanStatus: $status,
            courtName: $c['court_name'] ?? null,
            paymentDate: $c['payment_date'] ?? null,
            receiptNumber: $c['receipt_number'] ?? null,
            parivahanUrl: $c['parivahan_url'] ?? "https://echallan.parivahan.gov.in/index/accused-challan?challan_number={$challanNum}"
        );
    }

    public function getFineAmountInr(): float
    {
        return $this->fineAmountPaise / 100;
    }

    public function toArray(): array
    {
        return [
            'challan_number' => $this->challanNumber,
            'offence_details' => $this->offenceDetails,
            'offence_date_time' => $this->offenceDateTime,
            'fine_amount_paise' => $this->fineAmountPaise,
            'fine_amount_inr' => $this->getFineAmountInr(),
            'fine_amount_formatted' => '₹' . number_format($this->getFineAmountInr(), 2),
            'state_code' => $this->stateCode,
            'rto_name' => $this->rtoName,
            'challan_status' => $this->challanStatus,
            'court_name' => $this->courtName,
            'payment_date' => $this->paymentDate,
            'receipt_number' => $this->receiptNumber,
            'parivahan_url' => $this->parivahanUrl,
        ];
    }
}
