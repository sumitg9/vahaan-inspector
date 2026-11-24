<?php

namespace App\Modules\Providers\DTOs;

/**
 * Standardized Data Transfer Object for a complete vehicle Challan query response.
 * Enforces integer minor units (paise) and indelible demonstration watermarks.
 */
class NormalizedChallanResponseDto
{
    /**
     * @param NormalizedChallanDto[] $challans
     */
    public function __construct(
        public readonly string $registrationNumber,
        public readonly int $totalChallans,
        public readonly int $pendingChallansCount,
        public readonly int $totalPendingPaise,
        public readonly int $totalDisposedPaise,
        public readonly array $challans,
        public readonly string $providerSource,
        public readonly bool $isMockData,
        public readonly ?string $watermark,
        public readonly string $rawResponseHash,
        public readonly string $fetchedAt
    ) {}

    public static function fromRaw(string $regNo, array $challansRaw, string $providerSource, bool $isMock = false): self
    {
        $hash = hash('sha256', json_encode($challansRaw) ?: '');
        $items = [];
        $pendingCount = 0;
        $pendingPaise = 0;
        $disposedPaise = 0;

        foreach ($challansRaw as $c) {
            $dto = NormalizedChallanDto::fromRaw($c);
            $items[] = $dto;
            if ($dto->challanStatus === 'PENDING') {
                $pendingCount++;
                $pendingPaise += $dto->fineAmountPaise;
            } elseif ($dto->challanStatus === 'DISPOSED') {
                $disposedPaise += $dto->fineAmountPaise;
            }
        }

        return new self(
            registrationNumber: strtoupper(trim($regNo)),
            totalChallans: count($items),
            pendingChallansCount: $pendingCount,
            totalPendingPaise: $pendingPaise,
            totalDisposedPaise: $disposedPaise,
            challans: $items,
            providerSource: $providerSource,
            isMockData: $isMock,
            watermark: $isMock ? 'DEMONSTRATION DATA — NOT FOR OFFICIAL USE' : null,
            rawResponseHash: $hash,
            fetchedAt: date('Y-m-d H:i:s')
        );
    }

    public function toArray(): array
    {
        return [
            'registration_number' => $this->registrationNumber,
            'total_challans' => $this->totalChallans,
            'pending_challans_count' => $this->pendingChallansCount,
            'total_pending_paise' => $this->totalPendingPaise,
            'total_pending_inr' => $this->totalPendingPaise / 100,
            'total_pending_formatted' => '₹' . number_format($this->totalPendingPaise / 100, 2),
            'total_disposed_paise' => $this->totalDisposedPaise,
            'total_disposed_inr' => $this->totalDisposedPaise / 100,
            'challans' => array_map(fn($c) => $c->toArray(), $this->challans),
            'provider_source' => $this->providerSource,
            'is_mock_data' => $this->isMockData,
            'watermark' => $this->watermark,
            'raw_response_hash' => $this->rawResponseHash,
            'fetched_at' => $this->fetchedAt,
        ];
    }
}
