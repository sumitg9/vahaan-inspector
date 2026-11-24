<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('type', 50); // EXPIRY_ALERT_30D, EXPIRY_ALERT_7D, EXPIRY_CRITICAL_TODAY, BULK_VERIFY_COMPLETE, COST_LIMIT_WARNING
            $table->string('title');
            $table->text('message');
            $table->string('severity', 20)->default('INFO'); // INFO, WARNING, CRITICAL, SUCCESS
            $table->json('data')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['organization_id', 'read_at']);
            $table->index(['organization_id', 'type']);
        });

        Schema::create('scheduled_fleet_checks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->string('frequency', 20)->default('DAILY'); // DAILY, WEEKLY
            $table->integer('hour_utc')->default(2);
            $table->boolean('is_enabled')->default(true);
            $table->integer('max_credits_per_run')->default(500);
            $table->integer('auto_reverify_older_than_days')->default(15);
            $table->json('alert_recipients')->nullable();
            $table->timestamp('last_run_at')->nullable();
            $table->json('last_run_summary')->nullable();
            $table->timestamps();

            $table->unique('organization_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scheduled_fleet_checks');
        Schema::dropIfExists('notifications');
    }
};
