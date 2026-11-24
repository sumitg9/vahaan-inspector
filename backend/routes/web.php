<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'platform' => 'VahanCheck Enterprise API',
        'status' => 'operational',
        'version' => '1.0.0',
        'docs' => '/docs/API_CONTRACTS.md',
    ]);
});
