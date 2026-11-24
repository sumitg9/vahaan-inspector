<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->string('name');
            $table->string('client_type', 50)->default('BANK'); // BANK, NBFC, DEALER, SURVEYOR, FLEET_OPERATOR
            $table->string('contact_person');
            $table->string('email');
            $table->string('phone', 20);
            $table->string('pan_number', 10)->nullable();
            $table->string('gst_number', 15)->nullable();
            $table->text('billing_address')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['organization_id', 'is_active']);
        });

        Schema::create('bank_branches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('client_id')->constrained('clients')->cascadeOnDelete();
            $table->string('branch_name');
            $table->string('branch_code', 50);
            $table->string('contact_person')->nullable();
            $table->string('email')->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('city', 100);
            $table->string('state', 100);
            $table->text('address')->nullable();
            $table->timestamps();

            $table->unique(['client_id', 'branch_code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bank_branches');
        Schema::dropIfExists('clients');
    }
};
