<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Stray reports are intentionally decoupled from the adoption `animals`
     * table: a lost/found/injured animal is never automatically adoptable.
     */
    public function up(): void
    {
        Schema::create('stray_reports', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['lost', 'found', 'injured'])->index();
            $table->string('species')->index();
            $table->string('breed')->nullable();
            $table->string('color')->nullable();
            $table->text('description');
            $table->string('location');
            $table->date('occurred_at')->nullable();
            $table->string('contact_name');
            $table->string('contact_phone');
            $table->string('contact_email')->nullable();
            $table->enum('status', ['open', 'resolved'])->default('open')->index();
            $table->foreignId('reported_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stray_reports');
    }
};
