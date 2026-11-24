<?php

namespace App\Http\Middleware;

use App\Modules\Auditing\Services\AuditService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePermissionMiddleware
{
    /**
     * Handle an incoming request and check required permission.
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'type' => 'https://errors.vahancheck.com/unauthenticated',
                'title' => 'Unauthenticated',
                'status' => 401,
                'detail' => 'Authentication token required.',
                'instance' => $request->path(),
                'timestamp' => now()->toISOString(),
            ], 401);
        }

        if (!$user->is_active) {
            return response()->json([
                'type' => 'https://errors.vahancheck.com/account-suspended',
                'title' => 'Account Suspended',
                'status' => 403,
                'detail' => 'User account is deactivated.',
                'instance' => $request->path(),
                'timestamp' => now()->toISOString(),
            ], 403);
        }

        if (!$user->hasPermission($permission)) {
            // Log security privilege escalation attempt
            AuditService::logSecurityAlert(
                $user->organization_id,
                $user->id,
                'PRIVILEGE_ESCALATION_ATTEMPT',
                'permissions',
                null,
                ['required_permission' => $permission, 'user_role' => $user->role],
                $request->ip(),
                $request->userAgent()
            );

            return response()->json([
                'type' => 'https://errors.vahancheck.com/forbidden',
                'title' => 'Forbidden',
                'status' => 403,
                'detail' => "User does not hold the required permission: '{$permission}'.",
                'instance' => $request->path(),
                'timestamp' => now()->toISOString(),
            ], 403);
        }

        return $next($request);
    }
}
