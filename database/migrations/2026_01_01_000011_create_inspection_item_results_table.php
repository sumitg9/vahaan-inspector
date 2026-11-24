<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inspection_item_results', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('inspection_case_id')->constrained('inspection_cases')->cascadeOnDelete();
            $table->string('section_key', 100); // exterior, cabin, chassis, engine, transmission, electricals, documents, safety
            $table->string('item_key', 100);
            $table->string('item_label');
            $table->string('rating', 50)->default('NOT_CHECKED'); // PASS, FAIL, ATTENTION_REQUIRED, NOT_APPLICABLE, NOT_CHECKED
            $table->integer('score')->nullable(); // 1-5 or 0-100
            $table->text('remarks')->nullable();
            $table->boolean('verified_physically')->default(false);
            $table->timestamps();

            $table->unique(['inspection_case_id', 'section_key', 'item_key']);
            $table->index(['inspection_case_id', 'rating']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inspection_item_results');
    }
};
