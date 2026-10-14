<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('animals', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('species')->index();
            $table->string('breed')->nullable();
            $table->enum('sex', ['male', 'female', 'unknown'])->default('unknown');
            $table->enum('size', ['small', 'medium', 'large'])->nullable();
            $table->unsignedInteger('age_months')->nullable();
            $table->text('description')->nullable();
            $table->enum('status', ['available', 'pending', 'adopted'])->default('available')->index();
            $table->boolean('vaccinated')->default(false);
            $table->boolean('sterilized')->default(false);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('animals');
    }
};
