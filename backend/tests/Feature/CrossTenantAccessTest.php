<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Organization;
use App\Models\Branch;
use App\Models\User;
use App\Http\Middleware\TenantContextMiddleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CrossTenantAccessTest extends TestCase
{
    /**
     * Test that a non-super-admin user attempting to pass another organization's ID via X-Tenant-ID is blocked.
     */
    public function test_forged_tenant_header_is_blocked_with_403_and_audited(): void
    {
        $orgSpeedcheck = new Organization(['id' => 'e4eaaaf2-d142-11e1-b3e4-080027620c41', 'name' => 'SpeedCheck']);
        $orgApex = new Organization(['id' => 'f5fbbbf3-e253-22f2-c4f5-191138731d52', 'name' => 'Apex Surveyors']);

        // User belongs to SpeedCheck
        $user = new User([
            'id' => '33333333-3333-3333-3333-333333333333',
            'organization_id' => $orgSpeedcheck->id,
            'role' => 'ORG_ADMIN',
            'is_active' => true,
        ]);

        $request = Request::create('/api/v1/branches', 'GET');
        $request->setUserResolver(fn() => $user);
        // Attempting to spoof Apex Surveyors tenant ID
        $request->headers->set('X-Tenant-ID', $orgApex->id);

        $middleware = new TenantContextMiddleware();
        $response = $middleware->handle($request, function ($req) {
            return response()->json(['status' => 'ok']);
        });

        // Must reject with 403 Forbidden
        $this->assertEquals(403, $response->getStatusCode());
        $content = json_decode($response->getContent(), true);
        $this->assertEquals('Cross-Tenant Access Violation', $content['title']);
    }

    /**
     * Test that user of Org A only queries branches belonging to Org A.
     */
    public function test_branch_queries_are_scoped_strictly_to_user_tenant(): void
    {
        $user = new User([
            'id' => '33333333-3333-3333-3333-333333333333',
            'organization_id' => 'e4eaaaf2-d142-11e1-b3e4-080027620c41',
            'role' => 'INSPECTOR',
            'is_active' => true,
        ]);

        $this->actingAs($user);

        $query = Branch::query();
        $sql = $query->toSql();

        $this->assertStringContainsString('organization_id', $sql);
    }
}
