<?php

namespace Database\Factories;

use App\Models\AdoptionApplication;
use App\Models\Animal;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AdoptionApplication>
 */
class AdoptionApplicationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'animal_id' => Animal::factory(),
            'applicant_id' => User::factory(),
            'message' => fake()->paragraph(),
            'status' => AdoptionApplication::STATUS_PENDING,
        ];
    }
}
