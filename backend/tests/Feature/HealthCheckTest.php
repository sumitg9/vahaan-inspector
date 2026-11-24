<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthCheckTest extends TestCase
{
    /**
     * Test the liveness ping endpoint.
     */
    public function test_ping_endpoint_returns_ok(): void
    {
        $response = $this->get('/api/ping');

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'ok',
        ]);
    }

    /**
     * Test the full diagnostic health check endpoint.
     */
    public function test_health_check_endpoint_returns_diagnostics(): void
    {
        $response = $this->get('/api/v1/health');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'status',
            'service',
            'version',
            'environment',
            'timestamp',
            'response_time_ms',
            'checks' => [
                'database',
                'cache',
                'storage',
                'provider',
            ],
        ]);
    }

    /**
     * Test provider mock watermark check in health output.
     */
    public function test_health_check_reports_provider_mode(): void
    {
        $response = $this->get('/api/v1/health');

        $response->assertStatus(200);
        $data = $response->json();
        $this->assertArrayHasKey('provider', $data['checks']);
        $this->assertEquals('mock', $data['checks']['provider']['mode']);
        $this->assertTrue($data['checks']['provider']['watermark_required']);
    }
}
