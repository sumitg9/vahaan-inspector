<?php

return [
    'vehicle_provider' => [
        'default' => env('PROVIDER_DEFAULT', 'mock'),
        'mock' => [
            'base_url' => env('MOCK_API_BASE_URL', 'http://127.0.0.1:4000'),
        ],
        'apisathi' => [
            'base_url' => env('APISATHI_BASE_URL', 'https://apisathi.in/api/v1'),
            'api_key' => env('APISATHI_API_KEY', ''),
            'secret_key' => env('APISATHI_SECRET_KEY', ''),
            'timeout' => env('APISATHI_TIMEOUT_SECONDS', 8),
        ],
    ],
];
