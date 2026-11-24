<?php

namespace App\Shared\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

trait TenantModelTrait
{
    /**
     * Boot the tenant scoping global scope and auto-assign organization_id.
     */
    protected static function bootTenantModelTrait(): void
    {
        // Global scope to restrict queries strictly to current organization
        static::addGlobalScope('organization', function (Builder $builder) {
            if (auth()->check() && !static::isSuperAdminUser(auth()->user())) {
                $builder->where($builder->getModel()->getTable() . '.organization_id', auth()->user()->organization_id);
            } elseif (request()->attributes->has('tenant_id')) {
                $builder->where($builder->getModel()->getTable() . '.organization_id', request()->attributes->get('tenant_id'));
            }
        });

        // Automatically bind organization_id upon creating new records
        static::creating(function (Model $model) {
            if (empty($model->organization_id)) {
                if (auth()->check() && !empty(auth()->user()->organization_id)) {
                    $model->organization_id = auth()->user()->organization_id;
                } elseif (request()->attributes->has('tenant_id')) {
                    $model->organization_id = request()->attributes->get('tenant_id');
                }
            }
        });
    }

    /**
     * Determine if given user has super-admin privilege.
     */
    protected static function isSuperAdminUser(mixed $user): bool
    {
        return isset($user->role) && $user->role === 'SUPER_ADMIN';
    }
}
