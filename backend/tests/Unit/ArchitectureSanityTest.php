<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class ArchitectureSanityTest extends TestCase
{
    /**
     * Test that all mandatory modular monolith directories exist.
     */
    public function test_all_domain_modules_exist(): void
    {
        $expectedModules = [
            'Auth', 'Organizations', 'Permissions', 'VehicleIntel',
            'Challans', 'Providers', 'Inspections', 'Evidence',
            'Tyres', 'Valuation', 'Reports', 'Clients',
            'Billing', 'Notifications', 'Fleet', 'Auditing'
        ];

        $modulesBase = dirname(__DIR__, 2) . '/app/Modules';

        foreach ($expectedModules as $module) {
            $path = $modulesBase . '/' . $module;
            $this->assertDirectoryExists($path, "Expected module directory '{$module}' not found.");
        }
    }

    /**
     * Test that database migrations exist for foundational tables.
     */
    public function test_foundational_database_migrations_exist(): void
    {
        $migrationsDir = dirname(__DIR__, 2) . '/database/migrations';
        $this->assertDirectoryExists($migrationsDir);

        $files = scandir($migrationsDir);
        $migrationFiles = array_filter($files, fn($f) => str_ends_with($f, '.php'));

        $this->assertGreaterThanOrEqual(5, count($migrationFiles), "Expected at least 5 migration files.");
    }
}
