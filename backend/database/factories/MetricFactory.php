<?php

namespace Database\Factories;

use App\Models\Metric;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Metric>
 */
class MetricFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->unique()->words(2, true),
            'description' => fake()->optional()->sentence(),
            'type' => 'numeric',
            'unit' => 'units',
            'scale_min' => 1,
            'scale_max' => 10,
            'is_active' => true,
        ];
    }

    public function numeric(string $unit = 'units'): static
    {
        return $this->state(fn () => ['type' => 'numeric', 'unit' => $unit]);
    }

    public function scale(int $min = 1, int $max = 10): static
    {
        return $this->state(fn () => [
            'type' => 'scale',
            'unit' => null,
            'scale_min' => $min,
            'scale_max' => $max,
        ]);
    }

    public function boolean(): static
    {
        return $this->state(fn () => ['type' => 'boolean', 'unit' => null]);
    }
}
