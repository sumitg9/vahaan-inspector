<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Organization;
use App\Models\User;
use App\Models\InspectionCase;
use App\Models\Client;
use App\Models\CreditWallet;

class TenantIsolationTest extends TestCase
{
    /**
     * Test that TenantModelTrait automatically applies global scope for organization_id.
     */
    public function test_tenant_model_trait_applies_global_scope(): void
    {
        $orgA = new Organization(['id' => '11111111-1111-1111-1111-111111111111', 'name' => 'Org A']);
        $orgB = new Organization(['id' => '22222222-2222-2222-2222-222222222222', 'name' => 'Org B']);

        $userA = new User(['id' => 'aaaa-aaaa', 'organization_id' => $orgA->id, 'role' => 'INSPECTOR']);

        // Simulate authentication as User A
        $this->actingAs($userA);

        $caseQuery = InspectionCase::query();
        $sql = $caseQuery->toSql();

        // Must contain organization_id scoping in WHERE clause
        $this->assertStringContainsString('organization_id', $sql);
    }

    /**
     * Test that user of Org A cannot access records belonging to Org B.
     */
    public function test_user_cannot_access_other_organization_records(): void
    {
        $orgA = new Organization(['id' => '11111111-1111-1111-1111-111111111111', 'name' => 'Org A']);
        $orgB = new Organization(['id' => '22222222-2222-2222-2222-222222222222', 'name' => 'Org B']);

        $userB = new User(['id' => 'bbbb-bbbb', 'organization_id' => $orgB->id, 'role' => 'INSPECTOR']);

        // Authenticate as User B
        $this->actingAs($userB);

        // Attempt to find record belonging to Org A
        $clientA = new Client(['organization_id' => $orgA->id]);

        $query = Client::where('id', 'some-id');
        $bindings = $query->getBindings();

        // Scoping should bind Org B's ID, preventing Org A lookup
        $this->assertContains($orgB->id, $bindings);
    }
}
