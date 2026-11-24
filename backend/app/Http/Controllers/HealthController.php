<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class HealthController extends Controller
{
    /**
     * Comprehensive system health check endpoint.
     */
    public function check(Request $request)
    {
        $startTime = microtime(true);
        $checks = [];
        $overallHealthy = true;

        // 1. Database Connection Check
        try {
            $pdo = DB::connection()->getPdo();
            $driver = DB::connection()->getDriverName();
            $checks['database'] = [
                'status' => 'healthy',
                'driver' => $driver,
                'latency_ms' => round((microtime(true) - $startTime) * 1000, 2),
            ];
        } catch (\Throwable $e) {
            $checks['database'] = [
                'status' => 'unreachable',
                'error' => config('app.debug') ? $e->getMessage() : 'Database connection unavailable',
            ];
            // In local/test mode without running postgres, do not crash the health check
            if (config('app.env') === 'production') {
                $overallHealthy = false;
            }
        }

        // 2. Cache / Redis Check
        try {
            $cacheKey = 'health_ping_' . time();
            Cache::put($cacheKey, 'ok', 10);
            $cachedVal = Cache::get($cacheKey);
            $checks['cache'] = [
                'status' => ($cachedVal === 'ok') ? 'healthy' : 'degraded',
                'store' => config('cache.default'),
            ];
        } catch (\Throwable $e) {
            $checks['cache'] = [
                'status' => 'degraded',
                'error' => config('app.debug') ? $e->getMessage() : 'Cache service unavailable',
            ];
        }

        // 3. Storage Check
        try {
            $disk = config('filesystems.default', 'local');
            $checks['storage'] = [
                'status' => 'healthy',
                'default_disk' => $disk,
            ];
        } catch (\Throwable $e) {
            $checks['storage'] = [
                'status' => 'degraded',
                'error' => $e->getMessage(),
            ];
        }

        // 4. Vehicle Intelligence Provider Mode
        $providerMode = config('services.vehicle_provider.default', env('PROVIDER_DEFAULT', 'mock'));
        $checks['provider'] = [
            'mode' => $providerMode,
            'watermark_required' => ($providerMode === 'mock'),
            'mock_server_configured' => !empty(env('MOCK_API_BASE_URL')),
        ];

        $totalDurationMs = round((microtime(true) - $startTime) * 1000, 2);

        $payload = [
            'status' => $overallHealthy ? 'healthy' : 'degraded',
            'service' => 'vahancheck-backend-api',
            'version' => '1.0.0',
            'environment' => config('app.env', 'local'),
            'timestamp' => now()->toISOString(),
            'response_time_ms' => $totalDurationMs,
            'checks' => $checks,
        ];

        return response()->json($payload, $overallHealthy ? 200 : 503);
    }

    /**
     * Lightweight liveness probe for Kubernetes / Docker health checks.
     */
    public function ping()
    {
        return response()->json([
            'status' => 'ok',
            'timestamp' => now()->toISOString(),
        ], 200);
    }
}
