<?php

namespace App\Modules\Admin\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\CreditWallet;
use App\Models\Organization;
use App\Models\WalletTransaction;
use App\Modules\Auditing\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdminOrganizationController extends Controller
{
    /**
     * List all platform organizations (Super Admin only).
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user->isSuperAdmin() && !$user->hasPermission('admin.orgs')) {
            return $this->error('Access denied. Super Admin privileges required.', 403);
        }

        $query = Organization::with(['branches', 'wallet'])->withCount(['users', 'inspectionCases']);

        if ($request->has('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->has('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('legal_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $orgs = $query->orderBy('created_at', 'desc')->get()->map(function ($org) {
            $balancePaise = $org->wallet?->balance_credits ? $org->wallet->balance_credits * 100 : 95000;
            return [
                'id' => $org->id,
                'name' => $org->name,
                'legal_name' => $org->legal_name,
                'slug' => $org->slug,
                'email' => $org->email,
                'phone' => $org->phone,
                'gst_number' => $org->gst_number,
                'pan_number' => $org->pan_number,
                'status' => $org->status,
                'tier' => $org->settings['tier'] ?? 'ENTERPRISE',
                'branches_count' => $org->branches->count(),
                'users_count' => $org->users_count,
                'inspections_count' => $org->inspection_cases_count,
                'wallet_balance_credits' => $org->wallet?->balance_credits ?? 950,
                'wallet_balance_paise' => $balancePaise,
                'wallet_balance_formatted' => '₹' . number_format(($balancePaise * 15) / 100, 2),
                'created_at' => $org->created_at ? $org->created_at->toISOString() : now()->toISOString(),
            ];
        });

        return $this->success($orgs);
    }

    /**
     * Provision a new tenant organization with isolated wallet & default branch.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user->isSuperAdmin() && !$user->hasPermission('admin.orgs')) {
            return $this->error('Access denied. Super Admin privileges required.', 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'legal_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:20',
            'gst_number' => 'nullable|string|max:20',
            'pan_number' => 'nullable|string|max:15',
            'tier' => 'nullable|in:STARTER,PROFESSIONAL,ENTERPRISE',
            'initial_credits' => 'nullable|integer|min:0',
        ]);

        $slug = Str::slug($validated['name']) . '-' . Str::lower(Str::random(4));

        $org = DB::transaction(function () use ($validated, $slug, $user, $request) {
            $org = Organization::create([
                'id' => (string) Str::uuid(),
                'name' => $validated['name'],
                'legal_name' => $validated['legal_name'],
                'slug' => $slug,
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'gst_number' => $validated['gst_number'] ?? null,
                'pan_number' => $validated['pan_number'] ?? null,
                'status' => 'ACTIVE',
                'settings' => [
                    'tier' => $validated['tier'] ?? 'ENTERPRISE',
                    'monthly_inspection_quota' => 500,
                    'feature_flags' => [
                        'enable_live_parivahan_lookup' => true,
                        'enable_ocr_comparison' => true,
                        'enforce_cmv_rule_95_tyres' => true,
                        'enable_distress_valuation_override' => true,
                        'enable_public_qr_verification' => true,
                    ],
                ],
            ]);

            // Create default headquarters branch
            Branch::create([
                'id' => (string) Str::uuid(),
                'organization_id' => $org->id,
                'name' => 'Headquarters - ' . $org->name,
                'code' => 'HQ-01',
                'city' => 'Mumbai',
                'state' => 'Maharashtra',
                'pincode' => '400001',
                'address' => 'Corporate Tower, Central Business District',
                'is_headquarters' => true,
            ]);

            // Create credit wallet (Invariant 5: integer minor units/credits)
            $credits = $validated['initial_credits'] ?? 500;
            CreditWallet::create([
                'id' => (string) Str::uuid(),
                'organization_id' => $org->id,
                'balance_credits' => $credits,
                'lifetime_credits_purchased' => $credits,
                'lifetime_credits_consumed' => 0,
            ]);

            AuditService::log(
                $org->id,
                $user->id,
                'ORGANIZATION_PROVISIONED',
                'organizations',
                $org->id,
                null,
                ['name' => $org->name, 'tier' => $validated['tier'] ?? 'ENTERPRISE'],
                $request->ip(),
                $request->userAgent()
            );

            return $org;
        });

        return $this->success($org, 'Tenant organization provisioned successfully with isolated wallet and branch.', 201);
    }

    /**
     * Show detailed organization profile.
     */
    public function show(Request $request, string $id)
    {
        $user = $request->user();
        if (!$user->isSuperAdmin() && !$user->hasPermission('admin.orgs') && $user->organization_id !== $id) {
            return $this->error('Access denied to requested organization.', 403);
        }

        $org = Organization::with(['branches', 'wallet'])->findOrFail($id);

        return $this->success([
            'id' => $org->id,
            'name' => $org->name,
            'legal_name' => $org->legal_name,
            'slug' => $org->slug,
            'email' => $org->email,
            'phone' => $org->phone,
            'gst_number' => $org->gst_number,
            'pan_number' => $org->pan_number,
            'status' => $org->status,
            'logo_url' => $org->logo_url,
            'report_disclaimer' => $org->report_disclaimer,
            'settings' => $org->settings,
            'branches' => $org->branches,
            'wallet' => [
                'balance_credits' => $org->wallet?->balance_credits ?? 0,
                'balance_formatted_inr' => '₹' . number_format(($org->wallet?->balance_credits ?? 0) * 15, 2),
            ],
            'created_at' => $org->created_at->toISOString(),
        ]);
    }

    /**
     * Update organization status, tier, or settings.
     */
    public function update(Request $request, string $id)
    {
        $user = $request->user();
        if (!$user->isSuperAdmin() && !$user->hasPermission('admin.orgs')) {
            return $this->error('Access denied. Super Admin privileges required.', 403);
        }

        $org = Organization::findOrFail($id);

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'legal_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'status' => 'nullable|in:ACTIVE,SUSPENDED,TRIAL',
            'tier' => 'nullable|in:STARTER,PROFESSIONAL,ENTERPRISE',
            'report_disclaimer' => 'nullable|string',
        ]);

        $oldValues = $org->only(['name', 'legal_name', 'status']);
        
        if (isset($validated['tier'])) {
            $settings = $org->settings ?? [];
            $settings['tier'] = $validated['tier'];
            $org->settings = $settings;
            unset($validated['tier']);
        }

        $org->fill($validated);
        $org->save();

        AuditService::log(
            $org->id,
            $user->id,
            'ORGANIZATION_UPDATED_BY_ADMIN',
            'organizations',
            $org->id,
            $oldValues,
            $validated,
            $request->ip(),
            $request->userAgent()
        );

        return $this->success($org->fresh(), 'Organization updated successfully.');
    }

    /**
     * Privileged Credit Wallet Allocation or Adjustment.
     */
    public function adjustCredits(Request $request, string $id)
    {
        $user = $request->user();
        if (!$user->isSuperAdmin() && !$user->hasPermission('admin.orgs')) {
            return $this->error('Access denied. Super Admin privileges required.', 403);
        }

        $validated = $request->validate([
            'credit_delta' => 'required|integer', // Positive to add, negative to deduct
            'reason' => 'required|string|min:5|max:255',
        ]);

        $org = Organization::findOrFail($id);

        $result = DB::transaction(function () use ($org, $validated, $user, $request) {
            $wallet = CreditWallet::where('organization_id', $org->id)->lockForUpdate()->first();
            if (!$wallet) {
                $wallet = CreditWallet::create([
                    'id' => (string) Str::uuid(),
                    'organization_id' => $org->id,
                    'balance_credits' => 0,
                    'lifetime_credits_purchased' => 0,
                    'lifetime_credits_consumed' => 0,
                ]);
            }

            $beforeBalance = $wallet->balance_credits;
            $newBalance = $beforeBalance + $validated['credit_delta'];

            if ($newBalance < 0) {
                throw new \InvalidArgumentException('Insufficient credit wallet balance for negative adjustment.');
            }

            $wallet->balance_credits = $newBalance;
            if ($validated['credit_delta'] > 0) {
                $wallet->lifetime_credits_purchased += $validated['credit_delta'];
            }
            $wallet->save();

            // Record immutable ledger entry (Invariant 5)
            $transaction = WalletTransaction::create([
                'id' => (string) Str::uuid(),
                'credit_wallet_id' => $wallet->id,
                'organization_id' => $org->id,
                'user_id' => $user->id,
                'type' => $validated['credit_delta'] >= 0 ? 'ALLOCATION' : 'ADJUSTMENT',
                'credits_amount' => abs($validated['credit_delta']),
                'balance_after' => $newBalance,
                'description' => $validated['reason'],
                'metadata' => ['admin_id' => $user->id, 'admin_name' => $user->name],
            ]);

            AuditService::log(
                $org->id,
                $user->id,
                'WALLET_CREDITS_ADJUSTED',
                'credit_wallets',
                $wallet->id,
                ['balance' => $beforeBalance],
                ['balance' => $newBalance, 'delta' => $validated['credit_delta'], 'reason' => $validated['reason']],
                $request->ip(),
                $request->userAgent()
            );

            return [
                'wallet_id' => $wallet->id,
                'balance_credits' => $newBalance,
                'balance_formatted_inr' => '₹' . number_format($newBalance * 15, 2),
                'transaction_id' => $transaction->id,
            ];
        });

        return $this->success($result, 'Organization credit wallet adjusted successfully.');
    }
}
