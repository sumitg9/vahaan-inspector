<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);

        $middleware->alias([
            'tenant' => \App\Http\Middleware\TenantContextMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Format RFC 7807 Problem Details
        $exceptions->render(function (\Throwable $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                $status = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;
                return response()->json([
                    'type' => 'https://errors.vahancheck.com/' . class_basename($e),
                    'title' => class_basename($e),
                    'status' => $status,
                    'detail' => $e->getMessage() ?: 'An unexpected server error occurred.',
                    'instance' => $request->path(),
                    'timestamp' => now()->toISOString(),
                ], $status);
            }
        });
    })->create();
