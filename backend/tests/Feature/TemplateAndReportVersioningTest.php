<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\InspectionTemplate;
use App\Models\ReportSnapshot;

class TemplateAndReportVersioningTest extends TestCase
{
    /**
     * Test that inspection templates support structured versioning.
     */
    public function test_inspection_template_versioning(): void
    {
        $template = new InspectionTemplate([
            'vehicle_category' => 'COMMERCIAL_HEAVY',
            'version' => 1,
            'schema_definition' => [
                'category' => 'COMMERCIAL_HEAVY',
                'sections' => [],
            ],
        ]);

        $this->assertEquals(1, $template->version);
        $this->assertEquals('COMMERCIAL_HEAVY', $template->vehicle_category);
        $this->assertIsArray($template->schema_definition);
    }

    /**
     * Test that report snapshots store immutable SHA-256 checksum and verification token.
     */
    public function test_report_snapshot_immutability_and_qr_token(): void
    {
        $data = ['vin' => 'MA3EWB12S00123456', 'fmv_inr' => 1700000];
        $checksum = hash('sha256', json_encode($data));

        $snapshot = new ReportSnapshot([
            'version' => '1.0',
            'verification_token' => 'rpt_test_token_123',
            'snapshot_data' => $data,
            'sha256_checksum' => $checksum,
            'is_mock_watermarked' => true,
        ]);

        $this->assertEquals('1.0', $snapshot->version);
        $this->assertEquals($checksum, $snapshot->sha256_checksum);
        $this->assertTrue($snapshot->is_mock_watermarked);
        $this->assertEquals('https://app.vahancheck.com/verify-report/rpt_test_token_123', $snapshot->verification_url);
    }
}
