<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('widgets', function (Blueprint $table) {
            $table->enum('chart_type', ['line', 'bar', 'stat', 'streak', 'heatmap'])->change();
        });
    }

    public function down(): void
    {
        DB::table('widgets')->where('chart_type', 'heatmap')->update(['chart_type' => 'line']);

        Schema::table('widgets', function (Blueprint $table) {
            $table->enum('chart_type', ['line', 'bar', 'stat', 'streak'])->change();
        });
    }
};
