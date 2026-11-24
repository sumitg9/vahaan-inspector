<?php

namespace App\Modules\Billing\Services;

use App\Models\CreditReservation;
use App\Models\CreditWallet;
use App\Models\WalletTransaction;
use App\Modules\Auditing\Services\AuditService;
use App\Modules\Billing\Exceptions\InsufficientCreditsException;
use App\Modules\Billing\Exceptions\ReservationNotFoundException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CreditReservationService
{
    /**
     * Reserve credits in a two-phase commit lock to prevent double-spending on long-running multi-stage tasks.
     *
     * @throws InsufficientCreditsException
     */
    public function reserve(
        string $organizationId,
        int $credits,
        string $referenceType,
        ?string $referenceId,
        string $idempotencyKey,
        int $ttlSeconds = 300
    ): CreditReservation {
        // Idempotency check on reservation key
        $existing = CreditReservation::where('idempotency_key', $idempotencyKey)->first();
        if ($existing) {
            return $existing;
        }

        return DB::transaction(function () use (
            $organizationId,
            $credits,
            $referenceType,
            $referenceId,
            $idempotencyKey,
            $ttlSeconds
        ) {
            $existing = CreditReservation::where('idempotency_key', $idempotencyKey)->first();
            if ($existing) {
                return $existing;
            }

            $wallet = CreditWallet::where('organization_id', $organizationId)->lockForUpdate()->first();
            if (!$wallet || $wallet->balance_credits < $credits) {
                throw new InsufficientCreditsException(
                    "Cannot reserve {$credits} Cr: available balance is " . ($wallet?->balance_credits ?? 0) . " Cr."
                );
            }

            // Temporarily hold credits
            $wallet->balance_credits -= $credits;
            $wallet->save();

            $reservation = CreditReservation::create([
                'id' => (string) Str::uuid(),
                'credit_wallet_id' => $wallet->id,
                'organization_id' => $organizationId,
                'credits_amount' => $credits,
                'status' => 'PENDING',
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'idempotency_key' => $idempotencyKey,
                'expires_at' => now()->addSeconds($ttlSeconds),
            ]);

            AuditService::log(
                $organizationId,
                null,
                'CREDIT_RESERVATION_HELD',
                'credit_reservations',
                $reservation->id,
                null,
                ['credits' => $credits, 'reference' => $referenceType, 'expires_at' => $reservation->expires_at]
            );

            return $reservation;
        });
    }

    /**
     * Commit a pending credit reservation into a finalized immutable ledger transaction.
     *
     * @throws ReservationNotFoundException
     */
    public function commit(
        string $reservationId,
        string $commitIdempotencyKey,
        array $metadata = []
    ): WalletTransaction {
        $reservation = CreditReservation::where('id', $reservationId)
            ->where('status', 'PENDING')
            ->first();

        if (!$reservation) {
            throw new ReservationNotFoundException("Active pending reservation {$reservationId} not found.");
        }

        return DB::transaction(function () use ($reservation, $commitIdempotencyKey, $metadata) {
            $existingTx = WalletTransaction::where('idempotency_key', $commitIdempotencyKey)->first();
            if ($existingTx) {
                return $existingTx;
            }

            $reservation->status = 'COMMITTED';
            $reservation->save();

            $wallet = CreditWallet::where('id', $reservation->credit_wallet_id)->first();

            $transaction = WalletTransaction::create([
                'id' => (string) Str::uuid(),
                'credit_wallet_id' => $reservation->credit_wallet_id,
                'transaction_type' => 'INSPECTION_DEDUCTION',
                'credits_amount' => $reservation->credits_amount,
                'balance_after' => $wallet?->balance_credits ?? 0,
                'idempotency_key' => $commitIdempotencyKey,
                'reference_type' => $reservation->reference_type,
                'reference_id' => $reservation->reference_id,
                'description' => 'Committed reservation ' . substr($reservation->id, 0, 8),
                'created_at' => now(),
            ]);

            AuditService::log(
                $reservation->organization_id,
                null,
                'CREDIT_RESERVATION_COMMITTED',
                'credit_reservations',
                $reservation->id,
                ['status' => 'PENDING'],
                ['status' => 'COMMITTED', 'transaction_id' => $transaction->id]
            );

            return $transaction;
        });
    }

    /**
     * Release a pending credit reservation back to the spendable wallet balance if the operation fails or is cancelled.
     */
    public function release(string $reservationId, string $reason): bool
    {
        $reservation = CreditReservation::where('id', $reservationId)
            ->where('status', 'PENDING')
            ->first();

        if (!$reservation) {
            return false;
        }

        return DB::transaction(function () use ($reservation, $reason) {
            $wallet = CreditWallet::where('id', $reservation->credit_wallet_id)->lockForUpdate()->first();
            if ($wallet) {
                // Restore held credits
                $wallet->balance_credits += $reservation->credits_amount;
                $wallet->save();
            }

            $reservation->status = 'RELEASED';
            $reservation->save();

            AuditService::log(
                $reservation->organization_id,
                null,
                'CREDIT_RESERVATION_RELEASED',
                'credit_reservations',
                $reservation->id,
                ['status' => 'PENDING'],
                ['status' => 'RELEASED', 'reason' => $reason]
            );

            return true;
        });
    }
}
