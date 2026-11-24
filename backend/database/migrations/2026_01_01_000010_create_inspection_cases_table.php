<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inspection_cases', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignUuid('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignUuid('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->foreignUuid('bank_branch_id')->nullable()->constrained('bank_branches')->nullOnDelete();
            $table->string('loan_reference_number', 100)->nullable();
            $table->foreignUuid('vehicle_profile_id')->constrained('vehicle_profiles')->restrictOnDelete();
            $table->foreignUuid('assigned_inspector_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('template_id')->constrained('inspection_templates')->restrictOnDelete();
            $table->string('status', 50)->default('DRAFT'); // DRAFT, ASSIGNED, IN_PROGRESS, SUBMITTED, UNDER_REVIEW, CORRECTIONS_REQUIRED, APPROVED, DELIVERED
            $table->string('priority', 20)->default('MEDIUM'); // LOW, MEDIUM, HIGH, URGENT
            $table->timestamp('scheduled_at')->nullable();
            $table->text('inspection_address');
            $table->decimal('inspection_latitude', 10, 7)->nullable();
            $table->decimal('inspection_longitude', 10, 7)->nullable();
            $table->integer('odometer_reading_km')->nullable();
            $table->boolean('engine_started')->nullable();
            $table->boolean('road_tested')->nullable();
            $table->string('summary_condition_rating', 30)->nullable(); // EXCELLENT, GOOD, AVERAGE, POOR, CRITICAL
            $table->text('qc_remarks')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->foreignUuid('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['organization_id', 'status']);
            $table->index(['assigned_inspector_id', 'status']);
            $table->index('scheduled_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inspection_cases');
    }
};
