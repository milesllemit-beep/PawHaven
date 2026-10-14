<?php

namespace Database\Factories;

use App\Models\StrayReport;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StrayReport>
 */
class StrayReportFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'type' => fake()->randomElement([
                StrayReport::TYPE_LOST,
                StrayReport::TYPE_FOUND,
                StrayReport::TYPE_INJURED,
            ]),
            'species' => fake()->randomElement(['dog', 'cat', 'rabbit', 'bird']),
            'breed' => fake()->optional()->word(),
            'color' => fake()->optional()->safeColorName(),
            'description' => fake()->paragraph(),
            'location' => fake()->city(),
            'occurred_at' => fake()->optional()->date(),
            'contact_name' => fake()->name(),
            'contact_phone' => fake()->phoneNumber(),
            'contact_email' => fake()->safeEmail(),
            'status' => StrayReport::STATUS_OPEN,
        ];
    }
}
