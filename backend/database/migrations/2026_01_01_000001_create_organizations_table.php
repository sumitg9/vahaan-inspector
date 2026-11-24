<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organizations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('legal_name')->nullable();
            $table->string('slug')->unique();
            $table->string('email');
            $table->string('phone', 20);
            $table->string('gst_number', 15)->nullable();
            $table->string('pan_number', 10)->nullable();
            $table->text('logo_url')->nullable();
            $table->text('report_disclaimer')->nullable();
            $table->string('status', 30)->default('ACTIVE'); // ACTIVE, SUSPENDED, TRIAL
            $table->jsonb('settings')->default('{}');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organizations');
    }
};
