<?php

namespace Database\Factories;

use App\Models\Dashboard;
use App\Models\Metric;
use App\Models\Widget;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Widget>
 */
class WidgetFactory extends Factory
{
    public function definition(): array
    {
        return [
            'dashboard_id' => Dashboard::factory(),
            'metric_id' => Metric::factory(),
            'chart_type' => 'line',
            'position' => 0,
            'config' => [],
        ];
    }
}
