<?php

namespace App\Http\Middleware;

use App\Modules\Auditing\Services\AuditService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TenantContextMiddleware
{
    /**
     * Handle an incoming request and ensure organization tenant context is bound.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user) {
            $effectiveTenantId = $user->organization_id;

            // Check if client supplied an override tenant header (e.g. Super-Admin debugging)
            $headerTenantId = $request->header('X-Tenant-ID');

            if ($headerTenantId && $headerTenantId !== $user->organization_id) {
                if (!$user->isSuperAdmin()) {
                    // Log security alert for attempted cross-tenant breach
                    AuditService::logSecurityAlert(
                        $user->organization_id,
                        $user->id,
                        'CROSS_TENANT_ACCESS_ATTEMPT',
                        'organizations',
                        null,
                        [
                            'attempted_tenant_id' => $headerTenantId,
                            'actual_tenant_id' => $user->organization_id,
                            'path' => $request->path(),
                        ],
                        $request->ip(),
                        $request->userAgent()
                    );

                    return response()->json([
                        'type' => 'https://errors.vahancheck.com/cross-tenant-violation',
                        'title' => 'Cross-Tenant Access Violation',
                        'status' => 403,
                        'detail' => 'You are not authorized to access or query another organization\'s resources.',
                        'instance' => $request->path(),
                        'timestamp' => now()->toISOString(),
                    ], 403);
                }

                $effectiveTenantId = $headerTenantId;
            }

            // Bind tenant_id to request attributes for models and global scopes
            $request->attributes->set('tenant_id', $effectiveTenantId);

            // Scope cache prefix per organization
            config(['cache.prefix' => 'tenant_' . $effectiveTenantId . '_']);
        }

        return $next($request);
    }
}
