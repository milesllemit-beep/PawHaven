<?php

namespace Tests\Feature;

use App\Models\Animal;
use App\Models\RescueCase;
use App\Models\RescueCasePhoto;
use App\Models\RescueMilestone;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class RescueCaseTest extends TestCase
{
    use RefreshDatabase;

    private function png(): UploadedFile
    {
        $content = base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        );

        return UploadedFile::fake()->createWithContent('photo.png', $content);
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Buddy',
            'species' => 'dog',
            'breed' => 'Labrador',
            'sex' => 'male',
            'rescued_at' => '2026-01-05',
            'rescue_location' => 'Riverside Park',
            'condition_on_rescue' => 'Thin and frightened but alert.',
            'description' => 'Found beside the road.',
            'care_notes' => 'Needs food and a warm place to rest.',
        ], $overrides);
    }

    public function test_guest_cannot_access_rescuer_endpoints(): void
    {
        $this->getJson('/api/rescuer/dashboard')->assertUnauthorized();
        $this->getJson('/api/rescuer/cases')->assertUnauthorized();
        $this->postJson('/api/rescuer/cases', $this->payload())->assertUnauthorized();
    }

    public function test_general_users_cannot_access_rescuer_endpoints(): void
    {
        $user = User::factory()->create(); // role: user

        $this->actingAs($user, 'sanctum')->getJson('/api/rescuer/dashboard')->assertForbidden();
        $this->actingAs($user, 'sanctum')->getJson('/api/rescuer/cases')->assertForbidden();
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/rescuer/cases', $this->payload())
            ->assertForbidden();
    }

    public function test_rescuer_can_create_a_case_with_initial_photos_and_a_timeline_entry(): void
    {
        Storage::fake('public');
        $rescuer = User::factory()->rescuer()->create();

        $response = $this->actingAs($rescuer, 'sanctum')->post('/api/rescuer/cases', [
            ...$this->payload(),
            'photos' => [$this->png(), $this->png()],
        ], ['Accept' => 'application/json']);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'Buddy')
            ->assertJsonPath('data.status', RescueCase::STATUS_RESCUED)
            ->assertJsonPath('data.primary_photo.is_primary', true);

        $case = RescueCase::first();
        $this->assertSame($rescuer->id, $case->rescuer_id);
        $this->assertDatabaseCount('rescue_case_photos', 2);
        $this->assertSame(2, $case->photos()->where('kind', RescueCasePhoto::KIND_INITIAL)->count());
        $this->assertTrue($case->photos()->where('is_primary', true)->exists());

        // A factual "rescue documented" milestone is created automatically.
        $this->assertDatabaseHas('rescue_milestones', [
            'rescue_case_id' => $case->id,
            'type' => RescueMilestone::TYPE_RESCUE,
            'created_by' => $rescuer->id,
        ]);
    }

    public function test_rescuer_cannot_forge_ownership_through_the_request(): void
    {
        $rescuer = User::factory()->rescuer()->create();
        $other = User::factory()->rescuer()->create();

        $this->actingAs($rescuer, 'sanctum')
            ->postJson('/api/rescuer/cases', $this->payload(['rescuer_id' => $other->id]))
            ->assertCreated();

        $this->assertSame($rescuer->id, RescueCase::first()->rescuer_id);
    }

    public function test_creating_a_case_validates_input(): void
    {
        $rescuer = User::factory()->rescuer()->create();

        $this->actingAs($rescuer, 'sanctum')
            ->postJson('/api/rescuer/cases', ['species' => '', 'rescued_at' => '', 'rescue_location' => ''])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['species', 'rescued_at', 'rescue_location']);
    }

    public function test_invalid_and_oversized_photos_are_rejected(): void
    {
        Storage::fake('public');
        $rescuer = User::factory()->rescuer()->create();

        $this->actingAs($rescuer, 'sanctum')->post('/api/rescuer/cases', [
            ...$this->payload(),
            'photos' => [UploadedFile::fake()->create('notes.pdf', 10, 'application/pdf')],
        ], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['photos.0']);

        $this->actingAs($rescuer, 'sanctum')->post('/api/rescuer/cases', [
            ...$this->payload(),
            'photos' => [UploadedFile::fake()->create('huge.jpg', 6000, 'image/jpeg')],
        ], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['photos.0']);

        $this->assertDatabaseCount('rescue_cases', 0);
    }

    public function test_rescuer_only_lists_their_own_cases(): void
    {
        $rescuer = User::factory()->rescuer()->create();
        $other = User::factory()->rescuer()->create();
        RescueCase::factory()->create(['rescuer_id' => $rescuer->id, 'name' => 'Mine']);
        RescueCase::factory()->create(['rescuer_id' => $other->id, 'name' => 'Theirs']);

        $this->actingAs($rescuer, 'sanctum')
            ->getJson('/api/rescuer/cases')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Mine');
    }

    public function test_rescuer_can_filter_cases_by_status_and_species(): void
    {
        $rescuer = User::factory()->rescuer()->create();
        RescueCase::factory()->create(['rescuer_id' => $rescuer->id, 'status' => RescueCase::STATUS_IN_CARE, 'species' => 'dog']);
        RescueCase::factory()->create(['rescuer_id' => $rescuer->id, 'status' => RescueCase::STATUS_RECOVERING, 'species' => 'cat']);

        $this->actingAs($rescuer, 'sanctum')
            ->getJson('/api/rescuer/cases?status=recovering')
            ->assertOk()->assertJsonCount(1, 'data');

        $this->actingAs($rescuer, 'sanctum')
            ->getJson('/api/rescuer/cases?species=dog')
            ->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_case_index_returns_a_scoped_summary_of_the_rescuers_cases(): void
    {
        $rescuer = User::factory()->rescuer()->create();
        $other = User::factory()->rescuer()->create();

        RescueCase::factory()->create(['rescuer_id' => $rescuer->id, 'status' => RescueCase::STATUS_IN_CARE, 'species' => 'dog']);
        RescueCase::factory()->create(['rescuer_id' => $rescuer->id, 'status' => RescueCase::STATUS_IN_CARE, 'species' => 'cat']);
        RescueCase::factory()->create(['rescuer_id' => $rescuer->id, 'status' => RescueCase::STATUS_ADOPTED, 'species' => 'dog']);
        RescueCase::factory()->create(['rescuer_id' => $other->id, 'status' => RescueCase::STATUS_IN_CARE, 'species' => 'rabbit']);

        // The summary ignores the active filter and reflects only this rescuer.
        $this->actingAs($rescuer, 'sanctum')
            ->getJson('/api/rescuer/cases?status=adopted')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('summary.total', 3)
            ->assertJsonPath('summary.by_status.in_care', 2)
            ->assertJsonPath('summary.by_status.adopted', 1)
            ->assertJsonPath('summary.by_status.rescued', 0)
            ->assertJsonPath('summary.species', ['cat', 'dog']);
    }

    public function test_rescuer_can_view_and_update_their_own_case(): void
    {
        $rescuer = User::factory()->rescuer()->create();
        $case = RescueCase::factory()->create(['rescuer_id' => $rescuer->id]);

        $this->actingAs($rescuer, 'sanctum')
            ->getJson("/api/rescuer/cases/{$case->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $case->id)
            ->assertJsonStructure(['data' => ['id', 'status', 'allowed_transitions', 'photos', 'milestones']]);

        $this->actingAs($rescuer, 'sanctum')
            ->patchJson("/api/rescuer/cases/{$case->id}", ['care_notes' => 'Doing much better.'])
            ->assertOk()
            ->assertJsonPath('data.care_notes', 'Doing much better.');

        $this->assertSame('Doing much better.', $case->fresh()->care_notes);
    }

    public function test_rescuer_cannot_access_another_rescuers_case(): void
    {
        $owner = User::factory()->rescuer()->create();
        $intruder = User::factory()->rescuer()->create();
        $case = RescueCase::factory()->create(['rescuer_id' => $owner->id]);

        $this->actingAs($intruder, 'sanctum')->getJson("/api/rescuer/cases/{$case->id}")->assertForbidden();
        $this->actingAs($intruder, 'sanctum')->patchJson("/api/rescuer/cases/{$case->id}", ['name' => 'Hacked'])->assertForbidden();
        $this->actingAs($intruder, 'sanctum')->patchJson("/api/rescuer/cases/{$case->id}/status", ['status' => 'in_care'])->assertForbidden();
        $this->actingAs($intruder, 'sanctum')->deleteJson("/api/rescuer/cases/{$case->id}")->assertForbidden();
        $this->actingAs($intruder, 'sanctum')->postJson("/api/rescuer/cases/{$case->id}/photos", ['photos' => [$this->png()]])->assertForbidden();
    }

    public function test_valid_status_transitions_are_enforced(): void
    {
        $rescuer = User::factory()->rescuer()->create();
        $case = RescueCase::factory()->create(['rescuer_id' => $rescuer->id, 'status' => RescueCase::STATUS_RESCUED]);

        $this->actingAs($rescuer, 'sanctum')
            ->patchJson("/api/rescuer/cases/{$case->id}/status", ['status' => RescueCase::STATUS_IN_CARE])
            ->assertOk()
            ->assertJsonPath('data.status', RescueCase::STATUS_IN_CARE);

        // Skipping backwards to a non-allowed status is rejected.
        $this->actingAs($rescuer, 'sanctum')
            ->patchJson("/api/rescuer/cases/{$case->id}/status", ['status' => RescueCase::STATUS_RESCUED])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['status']);
    }

    public function test_rescuer_cannot_mark_a_case_adopted(): void
    {
        $rescuer = User::factory()->rescuer()->create();
        $case = RescueCase::factory()->readyForAdoption()->create(['rescuer_id' => $rescuer->id]);

        $this->actingAs($rescuer, 'sanctum')
            ->patchJson("/api/rescuer/cases/{$case->id}/status", ['status' => RescueCase::STATUS_ADOPTED])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['status']);

        $this->assertSame(RescueCase::STATUS_READY_FOR_ADOPTION, $case->fresh()->status);
    }

    public function test_admin_can_mark_a_case_adopted(): void
    {
        $admin = User::factory()->admin()->create();
        $case = RescueCase::factory()->readyForAdoption()->create();

        // Admins do not use the rescuer endpoints.
        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/rescuer/cases/{$case->id}/status", ['status' => RescueCase::STATUS_ADOPTED])
            ->assertForbidden();

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/rescue-cases/{$case->id}/status", ['status' => RescueCase::STATUS_ADOPTED])
            ->assertOk()
            ->assertJsonPath('data.status', RescueCase::STATUS_ADOPTED);

        $this->assertNotNull($case->fresh()->adopted_at);
    }

    public function test_rescuer_can_upload_and_delete_case_photos(): void
    {
        Storage::fake('public');
        $rescuer = User::factory()->rescuer()->create();
        $case = RescueCase::factory()->create(['rescuer_id' => $rescuer->id]);

        $this->actingAs($rescuer, 'sanctum')->post('/api/rescuer/cases/'.$case->id.'/photos', [
            'photos' => [$this->png()],
            'caption' => 'Settling in',
        ], ['Accept' => 'application/json'])->assertOk();

        $photo = $case->photos()->first();
        $this->assertSame('Settling in', $photo->caption);
        Storage::disk('public')->assertExists($photo->path);

        $this->actingAs($rescuer, 'sanctum')
            ->deleteJson("/api/rescuer/cases/{$case->id}/photos/{$photo->id}")
            ->assertOk();

        $this->assertDatabaseMissing('rescue_case_photos', ['id' => $photo->id]);
        Storage::disk('public')->assertMissing($photo->path);
    }

    public function test_rescuer_can_manage_milestones_with_photos(): void
    {
        Storage::fake('public');
        $rescuer = User::factory()->rescuer()->create();
        $case = RescueCase::factory()->create(['rescuer_id' => $rescuer->id]);

        $created = $this->actingAs($rescuer, 'sanctum')->post('/api/rescuer/cases/'.$case->id.'/milestones', [
            'title' => 'First healthy check-up',
            'description' => 'Vet confirmed steady improvement.',
            'type' => RescueMilestone::TYPE_HEALTH,
            'occurred_at' => '2026-02-01',
            'photos' => [$this->png()],
        ], ['Accept' => 'application/json']);

        $created->assertCreated()->assertJsonPath('data.title', 'First healthy check-up');

        $milestone = RescueMilestone::first();
        $this->assertDatabaseCount('rescue_milestone_photos', 1);

        $this->actingAs($rescuer, 'sanctum')
            ->patchJson("/api/rescuer/cases/{$case->id}/milestones/{$milestone->id}", ['title' => 'Check-up complete'])
            ->assertOk()
            ->assertJsonPath('data.title', 'Check-up complete');

        $this->actingAs($rescuer, 'sanctum')
            ->deleteJson("/api/rescuer/cases/{$case->id}/milestones/{$milestone->id}")
            ->assertOk();

        $this->assertDatabaseMissing('rescue_milestones', ['id' => $milestone->id]);
    }

    public function test_milestones_are_scoped_to_their_case(): void
    {
        $rescuer = User::factory()->rescuer()->create();
        $caseA = RescueCase::factory()->create(['rescuer_id' => $rescuer->id]);
        $caseB = RescueCase::factory()->create(['rescuer_id' => $rescuer->id]);
        $milestone = RescueMilestone::factory()->create(['rescue_case_id' => $caseA->id]);

        $this->actingAs($rescuer, 'sanctum')
            ->patchJson("/api/rescuer/cases/{$caseB->id}/milestones/{$milestone->id}", ['title' => 'Nope'])
            ->assertNotFound();
    }

    public function test_another_rescuer_cannot_manage_milestones(): void
    {
        $owner = User::factory()->rescuer()->create();
        $intruder = User::factory()->rescuer()->create();
        $case = RescueCase::factory()->create(['rescuer_id' => $owner->id]);
        $milestone = RescueMilestone::factory()->create(['rescue_case_id' => $case->id]);

        $this->actingAs($intruder, 'sanctum')
            ->postJson("/api/rescuer/cases/{$case->id}/milestones", [
                'title' => 'Intruder',
                'occurred_at' => '2026-02-01',
            ])
            ->assertForbidden();

        $this->actingAs($intruder, 'sanctum')
            ->deleteJson("/api/rescuer/cases/{$case->id}/milestones/{$milestone->id}")
            ->assertForbidden();
    }

    public function test_dashboard_statistics_reflect_database_records(): void
    {
        $rescuer = User::factory()->rescuer()->create();
        $other = User::factory()->rescuer()->create();

        RescueCase::factory()->create(['rescuer_id' => $rescuer->id, 'status' => RescueCase::STATUS_RESCUED]);
        RescueCase::factory()->create(['rescuer_id' => $rescuer->id, 'status' => RescueCase::STATUS_IN_CARE]);
        RescueCase::factory()->create(['rescuer_id' => $rescuer->id, 'status' => RescueCase::STATUS_RECOVERING]);
        RescueCase::factory()->readyForAdoption()->create(['rescuer_id' => $rescuer->id]);
        RescueCase::factory()->create(['rescuer_id' => $rescuer->id, 'status' => RescueCase::STATUS_ADOPTED]);
        // Another rescuer's case must not be counted.
        RescueCase::factory()->create(['rescuer_id' => $other->id, 'status' => RescueCase::STATUS_RESCUED]);

        $this->actingAs($rescuer, 'sanctum')
            ->getJson('/api/rescuer/dashboard')
            ->assertOk()
            ->assertJsonPath('stats.total_rescued', 5)
            ->assertJsonPath('stats.in_care', 1)
            ->assertJsonPath('stats.recovering', 1)
            ->assertJsonPath('stats.ready_for_adoption', 1)
            ->assertJsonPath('stats.adopted', 1)
            ->assertJsonPath('profile.name', $rescuer->name);
    }

    public function test_dashboard_is_empty_for_a_new_rescuer(): void
    {
        $rescuer = User::factory()->rescuer()->create();

        $this->actingAs($rescuer, 'sanctum')
            ->getJson('/api/rescuer/dashboard')
            ->assertOk()
            ->assertJsonPath('stats.total_rescued', 0)
            ->assertJsonCount(0, 'recent_cases')
            ->assertJsonCount(0, 'recent_activity')
            ->assertJsonCount(0, 'recent_photos')
            ->assertJsonCount(0, 'passport_highlights');
    }

    public function test_admin_can_list_all_cases_and_publish_a_ready_case(): void
    {
        $admin = User::factory()->admin()->create();
        $rescuer = User::factory()->rescuer()->create();
        $case = RescueCase::factory()->readyForAdoption()->create(['rescuer_id' => $rescuer->id]);
        $animal = Animal::factory()->create(['status' => Animal::STATUS_AVAILABLE]);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/rescue-cases')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/rescue-cases/{$case->id}/publish", ['animal_id' => $animal->id])
            ->assertOk()
            ->assertJsonPath('data.animal.id', $animal->id);

        $this->assertSame($animal->id, $case->fresh()->animal_id);
    }

    public function test_rescuers_cannot_publish_cases(): void
    {
        $rescuer = User::factory()->rescuer()->create();
        $case = RescueCase::factory()->readyForAdoption()->create(['rescuer_id' => $rescuer->id]);
        $animal = Animal::factory()->create();

        $this->actingAs($rescuer, 'sanctum')
            ->patchJson("/api/admin/rescue-cases/{$case->id}/publish", ['animal_id' => $animal->id])
            ->assertForbidden();
    }
}
