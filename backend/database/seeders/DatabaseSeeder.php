<?php

namespace Database\Seeders;

use App\Models\Dashboard;
use App\Models\Entry;
use App\Models\Metric;
use App\Models\User;
use App\Models\Widget;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed a demo admin and a demo user with realistic sample data.
     */
    public function run(): void
    {
        // Admin account (manually assigned role). `role` is guarded, so set it
        // explicitly via forceFill rather than mass assignment.
        $admin = User::updateOrCreate(
            ['email' => 'admin@tracky.test'],
            ['name' => 'Admin', 'password' => Hash::make('password')],
        );
        $admin->forceFill(['role' => 'admin'])->save();

        // Demo user with sample metrics, entries, and a populated dashboard.
        $demo = User::updateOrCreate(
            ['email' => 'demo@tracky.test'],
            ['name' => 'Amir', 'password' => Hash::make('password')],
        );
        $demo->forceFill(['role' => 'user'])->save();

        if ($demo->metrics()->exists()) {
            return; // Avoid duplicating sample data on re-seed.
        }

        $sleep = Metric::create([
            'user_id' => $demo->id, 'name' => 'Sleep Hours', 'type' => 'numeric',
            'unit' => 'hours', 'is_active' => true,
        ]);
        $mood = Metric::create([
            'user_id' => $demo->id, 'name' => 'Mood', 'type' => 'scale',
            'scale_min' => 1, 'scale_max' => 10, 'is_active' => true,
        ]);
        $exercise = Metric::create([
            'user_id' => $demo->id, 'name' => 'Exercise', 'type' => 'boolean', 'is_active' => true,
        ]);
        $steps = Metric::create([
            'user_id' => $demo->id, 'name' => 'Steps', 'type' => 'numeric',
            'unit' => 'steps', 'is_active' => true,
        ]);

        // 21 days of entries.
        for ($i = 20; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i)->toDateString();
            $this->logEntry($demo->id, $sleep->id, $date, ['value_numeric' => 6 + ($i % 4) + 0.5]);
            $this->logEntry($demo->id, $mood->id, $date, ['value_scale' => 4 + ($i % 6)]);
            $this->logEntry($demo->id, $exercise->id, $date, ['value_boolean' => $i % 3 !== 0]);
            $this->logEntry($demo->id, $steps->id, $date, ['value_numeric' => 5000 + ($i * 200)]);
        }

        $dashboard = Dashboard::create([
            'user_id' => $demo->id, 'name' => 'My Health', 'description' => 'Daily health metrics',
        ]);

        Widget::create([
            'dashboard_id' => $dashboard->id, 'metric_id' => $sleep->id, 'chart_type' => 'line',
            'position' => 0, 'config' => ['range_days' => 14, 'show_points' => true, 'color' => '#6366f1'],
        ]);
        Widget::create([
            'dashboard_id' => $dashboard->id, 'metric_id' => $steps->id, 'chart_type' => 'bar',
            'position' => 1, 'config' => ['range_days' => 14, 'color' => '#22c55e'],
        ]);
        Widget::create([
            'dashboard_id' => $dashboard->id, 'metric_id' => $mood->id, 'chart_type' => 'stat',
            'position' => 2, 'config' => ['comparison' => 'average'],
        ]);
        Widget::create([
            'dashboard_id' => $dashboard->id, 'metric_id' => $exercise->id, 'chart_type' => 'streak',
            'position' => 3, 'config' => ['threshold_type' => 'boolean'],
        ]);
    }

    /**
     * @param  array<string, mixed>  $values
     */
    private function logEntry(int $userId, int $metricId, string $date, array $values): void
    {
        Entry::create([
            'user_id' => $userId,
            'metric_id' => $metricId,
            'logged_date' => $date,
            ...$values,
        ]);
    }
}
