<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Rescue cases document an animal's rescue journey and are intentionally
     * separate from the adoption `animals` table (whose status describes a
     * public listing) and from `stray_reports` (public lost/found/injured
     * reports). A case links to an `animals` listing only once published.
     */
    public function up(): void
    {
        Schema::create('rescue_cases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rescuer_id')->constrained('users')->cascadeOnDelete();
            $table->string('name')->nullable();
            $table->string('species')->index();
            $table->string('breed')->nullable();
            $table->unsignedInteger('estimated_age_months')->nullable();
            $table->enum('sex', ['male', 'female', 'unknown'])->default('unknown');
            $table->date('rescued_at');
            $table->string('rescue_location');
            $table->text('condition_on_rescue')->nullable();
            $table->text('description')->nullable();
            $table->text('care_notes')->nullable();
            $table->enum('status', [
                'rescued',
                'in_care',
                'recovering',
                'ready_for_adoption',
                'adopted',
            ])->default('rescued')->index();
            $table->foreignId('animal_id')->nullable()->constrained('animals')->nullOnDelete();
            $table->timestamp('adopted_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rescue_cases');
    }
};
