<?php

namespace Database\Factories;

use App\Models\Metric;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\Entry>
 */
class EntryFactory extends Factory
{
    public function definition(): array
    {
        $metric = Metric::factory();

        return [
            'metric_id' => $metric,
            'user_id' => fn (array $attrs) => Metric::find($attrs['metric_id'])?->user_id ?? \App\Models\User::factory(),
            'logged_date' => fake()->dateTimeBetween('-30 days', 'today')->format('Y-m-d'),
            'value_numeric' => fake()->randomFloat(2, 0, 100),
            'value_scale' => null,
            'value_boolean' => null,
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
