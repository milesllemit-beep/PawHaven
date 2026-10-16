<?php

namespace Database\Factories;

use App\Models\RescueCase;
use App\Models\RescueMilestone;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RescueMilestone>
 */
class RescueMilestoneFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'rescue_case_id' => RescueCase::factory(),
            'title' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'type' => fake()->randomElement(RescueMilestone::TYPES),
            'occurred_at' => fake()->dateTimeBetween('-6 months', 'now')->format('Y-m-d'),
        ];
    }
}
