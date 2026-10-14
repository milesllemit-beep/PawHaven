<?php

namespace Database\Factories;

use App\Models\Animal;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Animal>
 */
class AnimalFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->firstName(),
            'species' => fake()->randomElement(['dog', 'cat', 'rabbit', 'bird']),
            'breed' => fake()->optional()->word(),
            'sex' => fake()->randomElement(['male', 'female', 'unknown']),
            'size' => fake()->randomElement(['small', 'medium', 'large']),
            'age_months' => fake()->numberBetween(1, 120),
            'description' => fake()->paragraph(),
            'status' => Animal::STATUS_AVAILABLE,
            'vaccinated' => fake()->boolean(),
            'sterilized' => fake()->boolean(),
        ];
    }

    /**
     * Indicate that the animal is available for adoption.
     */
    public function available(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Animal::STATUS_AVAILABLE,
        ]);
    }
}
