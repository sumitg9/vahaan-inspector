<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BankBranch extends Model
{
    use HasUuids, HasFactory;

    protected $fillable = [
        'client_id',
        'branch_name',
        'branch_code',
        'contact_person',
        'email',
        'phone',
        'city',
        'state',
        'address',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }
}
