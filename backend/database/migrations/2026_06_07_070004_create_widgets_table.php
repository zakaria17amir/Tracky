<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('widgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dashboard_id')->constrained()->cascadeOnDelete();
            $table->foreignId('metric_id')->constrained()->cascadeOnDelete();
            $table->enum('chart_type', ['line', 'bar', 'stat', 'streak']);
            $table->integer('position')->default(0);
            $table->json('config')->default('{}');
            $table->timestamps();

            $table->index(['dashboard_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('widgets');
    }
};
