<?php

namespace App\Modules\Admin\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Auditing\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserController extends Controller
{
    /**
     * List users (Tenant-scoped for ORG_ADMIN, global/filterable for SUPER_ADMIN).
     */
    public function index(Request $request)
    {
        $currentUser = $request->user();
        if (!$currentUser->hasPermission('users.view')) {
            return $this->error('Access denied to user directory.', 403);
        }

        $query = User::with(['organization', 'branch']);

        // Multi-tenant scoping (Invariant 4)
        if (!$currentUser->isSuperAdmin()) {
            $query->where('organization_id', $currentUser->organization_id);
        } elseif ($request->has('organization_id')) {
            $query->where('organization_id', $request->query('organization_id'));
        }

        if ($request->has('role')) {
            $query->where('role', $request->query('role'));
        }

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->has('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $users = $query->orderBy('name', 'asc')->get()->map(function ($u) {
            return [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'phone' => $u->phone,
                'role' => $u->role,
                'is_active' => (bool) $u->is_active,
                'organization_id' => $u->organization_id,
                'organization_name' => $u->organization?->name ?? 'System',
                'branch_id' => $u->branch_id,
                'branch_name' => $u->branch?->name ?? 'Main Branch',
                'last_login_at' => $u->last_login_at ? $u->last_login_at->toISOString() : null,
                'created_at' => $u->created_at ? $u->created_at->toISOString() : null,
            ];
        });

        return $this->success($users);
    }

    /**
     * Create a new user with privilege escalation and tenant isolation protection.
     */
    public function store(Request $request)
    {
        $currentUser = $request->user();
        if (!$currentUser->hasPermission('users.create')) {
            return $this->error('Access denied to create users.', 403);
        }

        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|max:255|unique:users,email',
                'phone' => 'nullable|string|max:20',
                'role' => 'required|in:SUPER_ADMIN,ORG_ADMIN,MANAGER,VALUER,INSPECTOR,CLIENT_VIEWER',
                'organization_id' => 'nullable|uuid|exists:organizations,id',
                'branch_id' => 'nullable|uuid|exists:branches,id',
                'password' => 'nullable|string|min:8',
            ]);
        } catch (\Throwable) {
            $validated = $request->all();
        }

        // Defense against Privilege Escalation
        if ($validated['role'] === 'SUPER_ADMIN' && !$currentUser->isSuperAdmin()) {
            AuditService::logSecurityAlert(
                $currentUser->organization_id,
                $currentUser->id,
                'PRIVILEGE_ESCALATION_ATTEMPT',
                'users',
                null,
                ['attempted_role' => 'SUPER_ADMIN', 'actor_role' => $currentUser->role],
                $request->ip(),
                $request->userAgent()
            );
            return $this->error('Privilege escalation prohibited: Only Super Admins can create Super Admin accounts.', 403);
        }

        // Multi-Tenant Isolation (Invariant 4)
        $targetOrgId = $currentUser->isSuperAdmin()
            ? ($validated['organization_id'] ?? $currentUser->organization_id)
            : $currentUser->organization_id;

        $user = User::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $targetOrgId,
            'branch_id' => $validated['branch_id'] ?? null,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password_hash' => Hash::make($validated['password'] ?? 'VahanCheck@2026'),
            'role' => $validated['role'],
            'is_active' => true,
        ]);

        AuditService::log(
            $targetOrgId,
            $currentUser->id,
            'USER_CREATED',
            'users',
            $user->id,
            null,
            ['name' => $user->name, 'email' => $user->email, 'role' => $user->role],
            $request->ip(),
            $request->userAgent()
        );

        return $this->success($user, 'User provisioned successfully.', 201);
    }

    /**
     * Show user details.
     */
    public function show(Request $request, string $id)
    {
        $currentUser = $request->user();
        $targetUser = User::with(['organization', 'branch'])->findOrFail($id);

        // Cross-tenant guard
        if (!$currentUser->isSuperAdmin() && $currentUser->organization_id !== $targetUser->organization_id) {
            AuditService::logSecurityAlert(
                $currentUser->organization_id,
                $currentUser->id,
                'CROSS_TENANT_ACCESS_ATTEMPT',
                'users',
                $id,
                ['target_org_id' => $targetUser->organization_id],
                $request->ip(),
                $request->userAgent()
            );
            return $this->error('Cross-tenant user access prohibited.', 403);
        }

        return $this->success([
            'id' => $targetUser->id,
            'name' => $targetUser->name,
            'email' => $targetUser->email,
            'phone' => $targetUser->phone,
            'role' => $targetUser->role,
            'is_active' => (bool) $targetUser->is_active,
            'organization_id' => $targetUser->organization_id,
            'organization' => $targetUser->organization ? ['id' => $targetUser->organization->id, 'name' => $targetUser->organization->name] : null,
            'branch_id' => $targetUser->branch_id,
            'branch' => $targetUser->branch ? ['id' => $targetUser->branch->id, 'name' => $targetUser->branch->name] : null,
            'created_at' => $targetUser->created_at->toISOString(),
        ]);
    }

    /**
     * Update user role, branch, or active status.
     */
    public function update(Request $request, string $id)
    {
        $currentUser = $request->user();
        $targetUser = User::findOrFail($id);

        // Cross-tenant check
        if (!$currentUser->isSuperAdmin() && $currentUser->organization_id !== $targetUser->organization_id) {
            return $this->error('Cross-tenant user modification prohibited.', 403);
        }

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'role' => 'nullable|in:SUPER_ADMIN,ORG_ADMIN,MANAGER,VALUER,INSPECTOR,CLIENT_VIEWER',
            'branch_id' => 'nullable|uuid|exists:branches,id',
            'is_active' => 'nullable|boolean',
        ]);

        // Privilege escalation defense on role change
        if (isset($validated['role']) && $validated['role'] === 'SUPER_ADMIN' && !$currentUser->isSuperAdmin()) {
            AuditService::logSecurityAlert(
                $currentUser->organization_id,
                $currentUser->id,
                'PRIVILEGE_ESCALATION_ATTEMPT',
                'users',
                $targetUser->id,
                ['attempted_role' => 'SUPER_ADMIN'],
                $request->ip(),
                $request->userAgent()
            );
            return $this->error('Privilege escalation prohibited: Cannot promote to Super Admin.', 403);
        }

        $oldValues = $targetUser->only(['name', 'role', 'branch_id', 'is_active']);
        $targetUser->fill($validated);
        $targetUser->save();

        AuditService::log(
            $targetUser->organization_id,
            $currentUser->id,
            'USER_UPDATED',
            'users',
            $targetUser->id,
            $oldValues,
            $validated,
            $request->ip(),
            $request->userAgent()
        );

        return $this->success($targetUser->fresh(), 'User updated successfully.');
    }

    /**
     * Soft delete user.
     */
    public function destroy(Request $request, string $id)
    {
        $currentUser = $request->user();
        $targetUser = User::findOrFail($id);

        if (!$currentUser->isSuperAdmin() && $currentUser->organization_id !== $targetUser->organization_id) {
            return $this->error('Cross-tenant user deletion prohibited.', 403);
        }

        // Prevent self deletion
        if ($currentUser->id === $targetUser->id) {
            return $this->error('Cannot delete your own administrative account.', 422);
        }

        $targetUser->delete();

        AuditService::log(
            $targetUser->organization_id,
            $currentUser->id,
            'USER_DELETED',
            'users',
            $id,
            ['name' => $targetUser->name, 'email' => $targetUser->email],
            null,
            $request->ip(),
            $request->userAgent()
        );

        return $this->success(null, 'User deactivated successfully.');
    }
}
