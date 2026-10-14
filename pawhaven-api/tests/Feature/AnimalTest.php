<?php

namespace Tests\Feature;

use App\Models\Animal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AnimalTest extends TestCase
{
    use RefreshDatabase;

    private function png(): UploadedFile
    {
        $content = base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        );

        return UploadedFile::fake()->createWithContent('photo.png', $content);
    }

    public function test_public_can_list_available_animals(): void
    {
        Animal::factory()->count(2)->create(['species' => 'dog']);
        Animal::factory()->create(['species' => 'cat']);

        $this->getJson('/api/animals')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonStructure([
                'data' => [['id', 'name', 'species', 'status', 'photos']],
                'meta' => ['current_page', 'total'],
                'links',
            ]);
    }

    public function test_listing_can_be_filtered_and_searched(): void
    {
        Animal::factory()->create(['species' => 'dog', 'name' => 'Rex', 'size' => 'large', 'age_months' => 24]);
        Animal::factory()->create(['species' => 'cat', 'name' => 'Milo', 'size' => 'small', 'age_months' => 6]);

        $this->getJson('/api/animals?species=cat')->assertJsonCount(1, 'data')->assertJsonPath('data.0.name', 'Milo');
        $this->getJson('/api/animals?search=Rex')->assertJsonCount(1, 'data')->assertJsonPath('data.0.name', 'Rex');
        $this->getJson('/api/animals?size=large')->assertJsonCount(1, 'data');
        $this->getJson('/api/animals?min_age=12')->assertJsonCount(1, 'data');
        $this->getJson('/api/animals?max_age=12')->assertJsonCount(1, 'data');
    }

    public function test_listing_defaults_to_available_and_supports_all_statuses(): void
    {
        Animal::factory()->create(['status' => Animal::STATUS_AVAILABLE]);
        Animal::factory()->create(['status' => Animal::STATUS_PENDING]);
        Animal::factory()->create(['status' => Animal::STATUS_ADOPTED]);

        $this->getJson('/api/animals')->assertJsonCount(1, 'data');
        $this->getJson('/api/animals?status=pending')->assertJsonCount(1, 'data');
        $this->getJson('/api/animals?status=all')->assertJsonCount(3, 'data');
    }

    public function test_guest_cannot_create_an_animal(): void
    {
        $this->postJson('/api/animals', ['name' => 'Rex', 'species' => 'dog', 'sex' => 'male'])
            ->assertUnauthorized();
    }

    public function test_non_admin_cannot_manage_animals(): void
    {
        $animal = Animal::factory()->create();
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/animals', ['name' => 'Rex', 'species' => 'dog', 'sex' => 'male'])
            ->assertForbidden();

        $this->actingAs($user, 'sanctum')
            ->deleteJson("/api/animals/{$animal->id}")
            ->assertForbidden();
    }

    public function test_admin_can_create_an_animal_with_a_photo(): void
    {
        Storage::fake('public');
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'sanctum')->post('/api/animals', [
            'name' => 'Rex',
            'species' => 'dog',
            'sex' => 'male',
            'size' => 'large',
            'age_months' => 24,
            'description' => 'Friendly dog',
            'photos' => [$this->png()],
        ], ['Accept' => 'application/json']);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'Rex')
            ->assertJsonPath('data.status', Animal::STATUS_AVAILABLE)
            ->assertJsonPath('data.photos.0.is_primary', true);

        $animal = Animal::firstWhere('name', 'Rex');
        $this->assertSame($admin->id, $animal->created_by);
        $this->assertDatabaseCount('animal_photos', 1);
        Storage::disk('public')->assertExists($animal->photos()->first()->path);
    }

    public function test_creating_an_animal_validates_input(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/animals', ['name' => '', 'species' => '', 'sex' => 'invalid'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'species', 'sex']);
    }

    public function test_admin_can_update_and_delete_an_animal(): void
    {
        $admin = User::factory()->admin()->create();
        $animal = Animal::factory()->create(['status' => Animal::STATUS_AVAILABLE]);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/animals/{$animal->id}", ['status' => Animal::STATUS_ADOPTED, 'name' => 'Updated'])
            ->assertOk()
            ->assertJsonPath('data.status', Animal::STATUS_ADOPTED)
            ->assertJsonPath('data.name', 'Updated');

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/animals/{$animal->id}")
            ->assertOk();

        $this->assertSoftDeleted('animals', ['id' => $animal->id]);
    }

    public function test_admin_can_delete_a_photo(): void
    {
        Storage::fake('public');
        $admin = User::factory()->admin()->create();
        $animal = Animal::factory()->create();
        $path = 'animals/test.png';
        Storage::disk('public')->put($path, 'content');
        $photo = $animal->photos()->create(['path' => $path, 'is_primary' => true]);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/animals/{$animal->id}/photos/{$photo->id}")
            ->assertOk();

        $this->assertDatabaseMissing('animal_photos', ['id' => $photo->id]);
        Storage::disk('public')->assertMissing($path);
    }

    public function test_unknown_animal_returns_not_found(): void
    {
        $this->getJson('/api/animals/999')->assertNotFound();
    }
}
