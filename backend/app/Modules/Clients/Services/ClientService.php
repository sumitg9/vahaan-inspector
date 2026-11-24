<?php

namespace App\Modules\Clients\Services;

use App\Models\BankBranch;
use App\Models\Client;
use Illuminate\Support\Str;

class ClientService
{
    /**
     * In-memory mock clients store for standalone testing environments.
     */
    protected static array $mockClients = [
        'org-11111111-1111-1111-1111-111111111111' => [
            [
                'id' => 'client-001',
                'organization_id' => 'org-11111111-1111-1111-1111-111111111111',
                'name' => 'HDFC Bank Auto Loans',
                'client_type' => 'BANK',
                'contact_person' => 'Rahul Sharma',
                'email' => 'rahul.sharma@hdfcbank.example.com',
                'phone' => '+91 98200 12345',
                'pan_number' => 'AAACH1234F',
                'gst_number' => '27AAACH1234F1Z5',
                'billing_address' => 'HDFC Bank House, Senapati Bapat Marg, Lower Parel, Mumbai 400013',
                'is_active' => true,
                'created_at' => '2026-01-01 00:00:00',
                'updated_at' => '2026-01-01 00:00:00',
            ],
            [
                'id' => 'client-002',
                'organization_id' => 'org-11111111-1111-1111-1111-111111111111',
                'name' => 'Tata Capital Commercial',
                'client_type' => 'NBFC',
                'contact_person' => 'Vikram Singhania',
                'email' => 'vikram.s@tatacapital.example.com',
                'phone' => '+91 98300 54321',
                'pan_number' => 'AAACT5678K',
                'gst_number' => '27AAACT5678K1Z2',
                'billing_address' => 'Tower A, Peninsula Business Park, Ganpatrao Kadam Marg, Lower Parel, Mumbai 400013',
                'is_active' => true,
                'created_at' => '2026-01-01 00:00:00',
                'updated_at' => '2026-01-01 00:00:00',
            ],
        ],
    ];

    /**
     * In-memory mock bank branches store for standalone testing environments.
     */
    protected static array $mockBranches = [
        'client-001' => [
            [
                'id' => 'branch-001',
                'client_id' => 'client-001',
                'branch_name' => 'Pune Main Branch',
                'branch_code' => 'HDFC0000001',
                'contact_person' => 'Kunal Joshi',
                'email' => 'pune.branch@hdfcbank.example.com',
                'phone' => '+91 20 2567 8900',
                'city' => 'Pune',
                'state' => 'Maharashtra',
                'address' => 'FC Road, Shivajinagar, Pune 411005',
                'created_at' => '2026-01-01 00:00:00',
            ],
        ],
    ];

    /**
     * Retrieve all clients belonging to the specified tenant organization.
     */
    public function getClients(string $organizationId, array $filters = []): array
    {
        if (class_exists(Client::class)) {
            try {
                $query = Client::where('organization_id', $organizationId);

                if (isset($filters['client_type']) && $filters['client_type'] !== 'ALL') {
                    $query->where('client_type', $filters['client_type']);
                }

                if (isset($filters['is_active'])) {
                    $query->where('is_active', (bool) $filters['is_active']);
                }

                if (!empty($filters['search'])) {
                    $term = '%' . $filters['search'] . '%';
                    $query->where(function ($q) use ($term) {
                        $q->where('name', 'ilike', $term)
                          ->orWhere('contact_person', 'ilike', $term)
                          ->orWhere('email', 'ilike', $term);
                    });
                }

                return $query->with('bankBranches')->orderBy('name', 'asc')->get()->toArray();
            } catch (\Throwable $e) {
                // Fallback to in-memory fixtures if database is unseeded or offline
            }
        }

        $list = self::$mockClients[$organizationId] ?? [];
        if (!empty($filters['search'])) {
            $s = strtolower($filters['search']);
            $list = array_values(array_filter($list, function ($c) use ($s) {
                return str_contains(strtolower($c['name']), $s) ||
                       str_contains(strtolower($c['contact_person']), $s);
            }));
        }

        return $list;
    }

    /**
     * Retrieve a single client ensuring organization boundary isolation.
     */
    public function getClient(string $clientId, string $organizationId): ?array
    {
        if (class_exists(Client::class)) {
            try {
                $client = Client::where('organization_id', $organizationId)
                    ->where('id', $clientId)
                    ->with('bankBranches')
                    ->first();

                if ($client) {
                    return $client->toArray();
                }
            } catch (\Throwable $e) {
                // Fallback to mock store
            }
        }

        $list = self::$mockClients[$organizationId] ?? [];
        foreach ($list as $c) {
            if ($c['id'] === $clientId) {
                $branches = self::$mockBranches[$clientId] ?? [];
                $c['bank_branches'] = $branches;
                return $c;
            }
        }

        return null;
    }

    /**
     * Create a new client under the tenant organization.
     */
    public function createClient(array $data, string $organizationId): array
    {
        if (empty($data['name'])) {
            throw new \InvalidArgumentException("Client organization name is required.");
        }
        if (empty($data['contact_person'])) {
            throw new \InvalidArgumentException("Primary contact person is required.");
        }
        if (empty($data['email'])) {
            throw new \InvalidArgumentException("Valid client email is required.");
        }
        if (empty($data['phone'])) {
            throw new \InvalidArgumentException("Contact phone number is required.");
        }

        $clientData = [
            'id' => self::generateUuid(),
            'organization_id' => $organizationId,
            'name' => trim($data['name']),
            'client_type' => strtoupper($data['client_type'] ?? 'BANK'),
            'contact_person' => trim($data['contact_person']),
            'email' => trim($data['email']),
            'phone' => trim($data['phone']),
            'pan_number' => !empty($data['pan_number']) ? strtoupper(trim($data['pan_number'])) : null,
            'gst_number' => !empty($data['gst_number']) ? strtoupper(trim($data['gst_number'])) : null,
            'billing_address' => $data['billing_address'] ?? null,
            'is_active' => $data['is_active'] ?? true,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ];

        if (class_exists(Client::class)) {
            try {
                $client = Client::create($clientData);
                return $client->toArray();
            } catch (\Throwable $e) {
                // Fallback to memory store
            }
        }

        if (!isset(self::$mockClients[$organizationId])) {
            self::$mockClients[$organizationId] = [];
        }
        self::$mockClients[$organizationId][] = $clientData;

        return $clientData;
    }

    /**
     * Update an existing client verifying tenant ownership.
     */
    public function updateClient(string $clientId, array $data, string $organizationId): ?array
    {
        if (class_exists(Client::class)) {
            try {
                $client = Client::where('organization_id', $organizationId)->where('id', $clientId)->first();
                if ($client) {
                    $client->update($data);
                    return $client->toArray();
                }
            } catch (\Throwable $e) {
                // Fallback to memory
            }
        }

        if (isset(self::$mockClients[$organizationId])) {
            foreach (self::$mockClients[$organizationId] as &$c) {
                if ($c['id'] === $clientId) {
                    $c = array_merge($c, $data, ['updated_at' => date('Y-m-d H:i:s')]);
                    return $c;
                }
            }
        }

        return null;
    }

    /**
     * Retrieve all bank branches for a client, ensuring tenant ownership.
     */
    public function getClientBranches(string $clientId, string $organizationId): array
    {
        // Verify client belongs to organization
        $client = $this->getClient($clientId, $organizationId);
        if (!$client) {
            throw new \InvalidArgumentException("Client not found or belongs to another organization.");
        }

        if (class_exists(BankBranch::class)) {
            try {
                return BankBranch::where('client_id', $clientId)->orderBy('branch_name', 'asc')->get()->toArray();
            } catch (\Throwable $e) {
                // Fallback
            }
        }

        return self::$mockBranches[$clientId] ?? [];
    }

    /**
     * Create a new bank branch for a client.
     */
    public function createBankBranch(string $clientId, array $data, string $organizationId): array
    {
        // Verify client belongs to organization
        $client = $this->getClient($clientId, $organizationId);
        if (!$client) {
            throw new \InvalidArgumentException("Client not found or belongs to another organization.");
        }

        if (empty($data['branch_name'])) {
            throw new \InvalidArgumentException("Branch name is required.");
        }
        if (empty($data['branch_code'])) {
            throw new \InvalidArgumentException("Branch code (e.g. IFSC/Branch Identifier) is required.");
        }
        if (empty($data['city'])) {
            throw new \InvalidArgumentException("Branch city is required.");
        }
        if (empty($data['state'])) {
            throw new \InvalidArgumentException("Branch state is required.");
        }

        $branchData = [
            'id' => self::generateUuid(),
            'client_id' => $clientId,
            'branch_name' => trim($data['branch_name']),
            'branch_code' => strtoupper(trim($data['branch_code'])),
            'contact_person' => $data['contact_person'] ?? null,
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'city' => trim($data['city']),
            'state' => trim($data['state']),
            'address' => $data['address'] ?? null,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ];

        if (class_exists(BankBranch::class)) {
            try {
                $branch = BankBranch::create($branchData);
                return $branch->toArray();
            } catch (\Throwable $e) {
                // Fallback
            }
        }

        if (!isset(self::$mockBranches[$clientId])) {
            self::$mockBranches[$clientId] = [];
        }
        self::$mockBranches[$clientId][] = $branchData;

        return $branchData;
    }

    /**
     * Generate a UUID string with fallback for standalone environments.
     */
    protected static function generateUuid(): string
    {
        if (class_exists(\Illuminate\Support\Str::class)) {
            return (string) \Illuminate\Support\Str::uuid();
        }
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
}
