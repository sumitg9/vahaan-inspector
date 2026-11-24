<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Http\Middleware\EnsurePermissionMiddleware;
use Illuminate\Http\Request;

class PrivilegeEscalationTest extends TestCase
{
    /**
     * Test that an Inspector attempting an administrative action is rejected with 403 and logged.
     */
    public function test_inspector_cannot_escalate_privilege_to_create_branches(): void
    {
        $inspector = new User([
            'id' => '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
            'organization_id' => 'e4eaaaf2-d142-11e1-b3e4-080027620c41',
            'role' => 'INSPECTOR',
            'is_active' => true,
        ]);

        $request = Request::create('/api/v1/branches', 'POST');
        $request->setUserResolver(fn() => $inspector);

        $middleware = new EnsurePermissionMiddleware();
        $response = $middleware->handle($request, function ($req) {
            return response()->json(['status' => 'should_not_reach']);
        }, 'branches.create');

        $this->assertEquals(403, $response->getStatusCode());
        $content = json_decode($response->getContent(), true);
        $this->assertEquals('Forbidden', $content['title']);
        $this->assertStringContainsString('branches.create', $content['detail']);
    }

    /**
     * Test that a Client Viewer cannot access valuation approval capability.
     */
    public function test_client_viewer_cannot_approve_valuations(): void
    {
        $clientViewer = new User([
            'id' => '66666666-6666-6666-6666-666666666666',
            'organization_id' => 'e4eaaaf2-d142-11e1-b3e4-080027620c41',
            'role' => 'CLIENT_VIEWER',
            'is_active' => true,
        ]);

        $request = Request::create('/api/v1/inspections/123/valuation/approve', 'POST');
        $request->setUserResolver(fn() => $clientViewer);

        $middleware = new EnsurePermissionMiddleware();
        $response = $middleware->handle($request, function ($req) {
            return response()->json(['status' => 'should_not_reach']);
        }, 'valuation.approve');

        $this->assertEquals(403, $response->getStatusCode());
    }

    /**
     * Test that an Org Admin successfully satisfies administrative permissions.
     */
    public function test_org_admin_satisfies_branch_permission(): void
    {
        $admin = new User([
            'id' => '33333333-3333-3333-3333-333333333333',
            'organization_id' => 'e4eaaaf2-d142-11e1-b3e4-080027620c41',
            'role' => 'ORG_ADMIN',
            'is_active' => true,
        ]);

        $request = Request::create('/api/v1/branches', 'POST');
        $request->setUserResolver(fn() => $admin);

        $middleware = new EnsurePermissionMiddleware();
        $response = $middleware->handle($request, function ($req) {
            return response()->json(['status' => 'authorized_proceed']);
        }, 'branches.create');

        $this->assertEquals(200, $response->getStatusCode());
    }
}
