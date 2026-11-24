<?php

namespace App\Modules\Permissions;

class PermissionMatrix
{
    // Granular System Permissions
    public const ORG_VIEW = 'org.view';
    public const ORG_UPDATE = 'org.update';

    public const BRANCHES_VIEW = 'branches.view';
    public const BRANCHES_CREATE = 'branches.create';
    public const BRANCHES_UPDATE = 'branches.update';
    public const BRANCHES_DELETE = 'branches.delete';

    public const USERS_VIEW = 'users.view';
    public const USERS_CREATE = 'users.create';
    public const USERS_UPDATE = 'users.update';
    public const USERS_DELETE = 'users.delete';

    public const VEHICLES_LOOKUP = 'vehicles.lookup';
    public const VEHICLES_BULK_VERIFY = 'vehicles.bulk_verify';

    public const FLEET_VIEW = 'fleet.view';
    public const FLEET_MANAGE = 'fleet.manage';
    public const FLEET_EXPORT = 'fleet.export';
    public const FLEET_SYNC = 'fleet.sync';

    public const CHALLANS_VIEW = 'challans.view';
    public const CHALLANS_REFRESH = 'challans.refresh';

    public const CLIENTS_VIEW = 'clients.view';
    public const CLIENTS_CREATE = 'clients.create';
    public const CLIENTS_UPDATE = 'clients.update';
    public const CLIENTS_DELETE = 'clients.delete';

    public const INSPECTIONS_VIEW_ALL = 'inspections.view_all';
    public const INSPECTIONS_VIEW_ASSIGNED = 'inspections.view_assigned';
    public const INSPECTIONS_CREATE = 'inspections.create';
    public const INSPECTIONS_ASSIGN = 'inspections.assign';
    public const INSPECTIONS_START = 'inspections.start';
    public const INSPECTIONS_UPDATE_ITEM = 'inspections.update_item';
    public const INSPECTIONS_UPLOAD_EVIDENCE = 'inspections.upload_evidence';
    public const INSPECTIONS_SUBMIT = 'inspections.submit';
    public const INSPECTIONS_REVIEW = 'inspections.review';
    public const INSPECTIONS_APPROVE = 'inspections.approve';

    public const VALUATION_VIEW = 'valuation.view';
    public const VALUATION_CALCULATE = 'valuation.calculate';
    public const VALUATION_OVERRIDE = 'valuation.override';
    public const VALUATION_APPROVE = 'valuation.approve';

    public const REPORTS_VIEW = 'reports.view';
    public const REPORTS_GENERATE = 'reports.generate';
    public const REPORTS_DOWNLOAD = 'reports.download';

    public const BILLING_VIEW_WALLET = 'billing.view_wallet';
    public const BILLING_TOPUP = 'billing.topup';
    public const BILLING_VIEW_INVOICES = 'billing.view_invoices';

    public const AUDIT_VIEW = 'audit.view';

    // Privileged Super Admin & System Governance Capabilities
    public const ADMIN_DASHBOARD = 'admin.dashboard';
    public const ADMIN_ORGS = 'admin.orgs';
    public const ADMIN_PROVIDERS = 'admin.providers';
    public const ADMIN_FEATURE_FLAGS = 'admin.feature_flags';
    public const ADMIN_REPORT_SETTINGS = 'admin.report_settings';
    public const ADMIN_ANALYTICS = 'admin.analytics';
    public const ADMIN_AUDIT = 'admin.audit';

    /**
     * Map of roles to default permission sets.
     */
    protected static array $rolePermissions = [
        'SUPER_ADMIN' => ['*'],

        'ORG_ADMIN' => [
            self::ORG_VIEW, self::ORG_UPDATE,
            self::BRANCHES_VIEW, self::BRANCHES_CREATE, self::BRANCHES_UPDATE, self::BRANCHES_DELETE,
            self::USERS_VIEW, self::USERS_CREATE, self::USERS_UPDATE, self::USERS_DELETE,
            self::CLIENTS_VIEW, self::CLIENTS_CREATE, self::CLIENTS_UPDATE, self::CLIENTS_DELETE,
            self::VEHICLES_LOOKUP, self::VEHICLES_BULK_VERIFY,
            self::FLEET_VIEW, self::FLEET_MANAGE, self::FLEET_EXPORT, self::FLEET_SYNC,
            self::CHALLANS_VIEW, self::CHALLANS_REFRESH,
            self::INSPECTIONS_VIEW_ALL, self::INSPECTIONS_CREATE, self::INSPECTIONS_ASSIGN,
            self::INSPECTIONS_REVIEW, self::INSPECTIONS_APPROVE,
            self::VALUATION_VIEW, self::VALUATION_APPROVE,
            self::REPORTS_VIEW, self::REPORTS_GENERATE, self::REPORTS_DOWNLOAD,
            self::BILLING_VIEW_WALLET, self::BILLING_TOPUP, self::BILLING_VIEW_INVOICES,
            self::AUDIT_VIEW,
        ],

        'MANAGER' => [
            self::ORG_VIEW,
            self::BRANCHES_VIEW,
            self::USERS_VIEW,
            self::CLIENTS_VIEW, self::CLIENTS_CREATE, self::CLIENTS_UPDATE,
            self::VEHICLES_LOOKUP,
            self::FLEET_VIEW, self::FLEET_MANAGE, self::FLEET_EXPORT,
            self::CHALLANS_VIEW,
            self::INSPECTIONS_VIEW_ALL, self::INSPECTIONS_CREATE, self::INSPECTIONS_ASSIGN,
            self::INSPECTIONS_REVIEW,
            self::VALUATION_VIEW,
            self::REPORTS_VIEW, self::REPORTS_DOWNLOAD,
            self::BILLING_VIEW_WALLET,
        ],

        'VALUER' => [
            self::ORG_VIEW,
            self::BRANCHES_VIEW,
            self::CLIENTS_VIEW,
            self::VEHICLES_LOOKUP,
            self::FLEET_VIEW, self::FLEET_MANAGE, self::FLEET_EXPORT,
            self::CHALLANS_VIEW,
            self::INSPECTIONS_VIEW_ALL, self::INSPECTIONS_REVIEW, self::INSPECTIONS_APPROVE,
            self::VALUATION_VIEW, self::VALUATION_CALCULATE, self::VALUATION_OVERRIDE, self::VALUATION_APPROVE,
            self::REPORTS_VIEW, self::REPORTS_GENERATE, self::REPORTS_DOWNLOAD,
        ],

        'INSPECTOR' => [
            self::CLIENTS_VIEW,
            self::INSPECTIONS_VIEW_ASSIGNED,
            self::INSPECTIONS_START,
            self::INSPECTIONS_UPDATE_ITEM,
            self::INSPECTIONS_UPLOAD_EVIDENCE,
            self::INSPECTIONS_SUBMIT,
            self::VEHICLES_LOOKUP,
            self::FLEET_VIEW, self::FLEET_MANAGE, self::FLEET_EXPORT,
            self::CHALLANS_VIEW,
        ],

        'CLIENT_VIEWER' => [
            self::REPORTS_VIEW,
            self::REPORTS_DOWNLOAD,
        ],
    ];

    /**
     * Get all permissions granted to a given role.
     */
    public static function getPermissionsForRole(string $role): array
    {
        return self::$rolePermissions[$role] ?? [];
    }

    /**
     * Check if a role possesses a specific permission.
     */
    public static function roleHasPermission(string $role, string $permission): bool
    {
        if ($role === 'SUPER_ADMIN') {
            return true;
        }

        $granted = self::$rolePermissions[$role] ?? [];
        return in_array($permission, $granted, true);
    }
}
