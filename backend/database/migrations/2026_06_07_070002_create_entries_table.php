<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('metric_id')->constrained()->cascadeOnDelete();
            // Denormalized owner reference for fast scoping without a join.
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('logged_date');
            $table->decimal('value_numeric', 10, 2)->nullable();
            $table->integer('value_scale')->nullable();
            $table->boolean('value_boolean')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            // One entry per metric per day.
            $table->unique(['metric_id', 'logged_date']);
            // Chart range queries hit (metric_id, logged_date); list/history hits (user_id, logged_date).
            $table->index(['user_id', 'logged_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('entries');
    }
};
