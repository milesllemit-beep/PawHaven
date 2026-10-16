<?php

namespace Database\Factories;

use App\Models\RescueCase;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RescueCase>
 */
class RescueCaseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'rescuer_id' => User::factory()->rescuer(),
            'name' => fake()->optional(0.8)->firstName(),
            'species' => fake()->randomElement(['dog', 'cat', 'rabbit', 'bird']),
            'breed' => fake()->optional()->word(),
            'estimated_age_months' => fake()->optional()->numberBetween(1, 180),
            'sex' => fake()->randomElement(['male', 'female', 'unknown']),
            'rescued_at' => fake()->dateTimeBetween('-1 year', 'now')->format('Y-m-d'),
            'rescue_location' => fake()->city(),
            'condition_on_rescue' => fake()->sentence(),
            'description' => fake()->paragraph(),
            'care_notes' => fake()->optional()->sentence(),
            'status' => RescueCase::STATUS_RESCUED,
        ];
    }

    /**
     * Indicate that the case is ready for adoption.
     */
    public function readyForAdoption(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => RescueCase::STATUS_READY_FOR_ADOPTION,
        ]);
    }
}
