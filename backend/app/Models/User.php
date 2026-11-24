<?php

namespace App\Models;

use App\Modules\Permissions\PermissionMatrix;
use App\Shared\Traits\TenantModelTrait;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasUuids, HasFactory, HasApiTokens, SoftDeletes, TenantModelTrait;

    protected $fillable = [
        'organization_id',
        'branch_id',
        'name',
        'email',
        'phone',
        'password_hash',
        'role',
        'is_active',
        'device_token',
        'last_login_at',
    ];

    protected $hidden = [
        'password_hash',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_login_at' => 'datetime',
    ];

    public function getAuthPassword()
    {
        return $this->password_hash;
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'SUPER_ADMIN';
    }

    /**
     * Check if user possesses given capability.
     */
    public function hasPermission(string $permission): bool
    {
        return PermissionMatrix::roleHasPermission($this->role, $permission);
    }

    /**
     * Return list of granted permissions.
     */
    public function getPermissions(): array
    {
        return PermissionMatrix::getPermissionsForRole($this->role);
    }
}
