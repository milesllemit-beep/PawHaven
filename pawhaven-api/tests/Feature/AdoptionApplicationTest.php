<?php

namespace Tests\Feature;

use App\Models\AdoptionApplication;
use App\Models\Animal;
use App\Models\RescueCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdoptionApplicationTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_apply(): void
    {
        $animal = Animal::factory()->create();

        $this->postJson('/api/adoption-applications', ['animal_id' => $animal->id])
            ->assertUnauthorized();
    }

    public function test_user_can_apply_for_an_available_animal(): void
    {
        $user = User::factory()->create();
        $animal = Animal::factory()->create(['status' => Animal::STATUS_AVAILABLE]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/adoption-applications', [
            'animal_id' => $animal->id,
            'message' => 'I would love to adopt.',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.status', AdoptionApplication::STATUS_PENDING)
            ->assertJsonPath('data.animal.id', $animal->id);

        $this->assertDatabaseHas('adoption_applications', [
            'animal_id' => $animal->id,
            'applicant_id' => $user->id,
            'status' => AdoptionApplication::STATUS_PENDING,
        ]);
    }

    public function test_cannot_apply_for_an_unavailable_animal(): void
    {
        $user = User::factory()->create();
        $animal = Animal::factory()->create(['status' => Animal::STATUS_ADOPTED]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/adoption-applications', ['animal_id' => $animal->id])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['animal_id']);
    }

    public function test_duplicate_active_applications_are_rejected(): void
    {
        $user = User::factory()->create();
        $animal = Animal::factory()->create(['status' => Animal::STATUS_AVAILABLE]);
        AdoptionApplication::factory()->create(['animal_id' => $animal->id, 'applicant_id' => $user->id]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/adoption-applications', ['animal_id' => $animal->id])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['animal_id']);
    }

    public function test_applicant_sees_only_their_own_applications(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        AdoptionApplication::factory()->create(['applicant_id' => $user->id]);
        AdoptionApplication::factory()->create(['applicant_id' => $other->id]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/adoption-applications')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_applicant_can_view_own_application_but_not_others(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $mine = AdoptionApplication::factory()->create(['applicant_id' => $user->id]);
        $theirs = AdoptionApplication::factory()->create(['applicant_id' => $other->id]);

        $this->actingAs($user, 'sanctum')
            ->getJson("/api/adoption-applications/{$mine->id}")
            ->assertOk();

        $this->actingAs($user, 'sanctum')
            ->getJson("/api/adoption-applications/{$theirs->id}")
            ->assertForbidden();
    }

    public function test_applicant_can_withdraw_a_pending_application_only(): void
    {
        $user = User::factory()->create();
        $application = AdoptionApplication::factory()->create([
            'applicant_id' => $user->id,
            'status' => AdoptionApplication::STATUS_PENDING,
        ]);

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/adoption-applications/{$application->id}/withdraw")
            ->assertOk()
            ->assertJsonPath('data.status', AdoptionApplication::STATUS_WITHDRAWN);

        $approved = AdoptionApplication::factory()->create([
            'applicant_id' => $user->id,
            'status' => AdoptionApplication::STATUS_APPROVED,
        ]);

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/adoption-applications/{$approved->id}/withdraw")
            ->assertForbidden();
    }

    public function test_non_admin_cannot_review_applications(): void
    {
        $user = User::factory()->create();
        $application = AdoptionApplication::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->patchJson("/api/adoption-applications/{$application->id}/review", ['status' => 'approved'])
            ->assertForbidden();
    }

    public function test_admin_approval_marks_animal_adopted_and_rejects_others(): void
    {
        $admin = User::factory()->admin()->create();
        $animal = Animal::factory()->create(['status' => Animal::STATUS_AVAILABLE]);
        $first = AdoptionApplication::factory()->create(['animal_id' => $animal->id]);
        $second = AdoptionApplication::factory()->create(['animal_id' => $animal->id]);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/adoption-applications/{$first->id}/review", [
                'status' => 'approved',
                'review_notes' => 'Great fit.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', AdoptionApplication::STATUS_APPROVED);

        $this->assertSame(Animal::STATUS_ADOPTED, $animal->fresh()->status);
        $this->assertSame(AdoptionApplication::STATUS_REJECTED, $second->fresh()->status);
    }

    public function test_approving_an_adoption_completes_a_linked_rescue_case(): void
    {
        $admin = User::factory()->admin()->create();
        $animal = Animal::factory()->create(['status' => Animal::STATUS_AVAILABLE]);
        $case = RescueCase::factory()->readyForAdoption()->create(['animal_id' => $animal->id]);
        $application = AdoptionApplication::factory()->create(['animal_id' => $animal->id]);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/adoption-applications/{$application->id}/review", ['status' => 'approved'])
            ->assertOk();

        $this->assertSame(RescueCase::STATUS_ADOPTED, $case->fresh()->status);
        $this->assertNotNull($case->fresh()->adopted_at);
    }

    public function test_admin_rejection_keeps_animal_available(): void
    {
        $admin = User::factory()->admin()->create();
        $animal = Animal::factory()->create(['status' => Animal::STATUS_AVAILABLE]);
        $application = AdoptionApplication::factory()->create(['animal_id' => $animal->id]);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/adoption-applications/{$application->id}/review", ['status' => 'rejected'])
            ->assertOk()
            ->assertJsonPath('data.status', AdoptionApplication::STATUS_REJECTED);

        $this->assertSame(Animal::STATUS_AVAILABLE, $animal->fresh()->status);
    }

    public function test_only_pending_applications_can_be_reviewed(): void
    {
        $admin = User::factory()->admin()->create();
        $application = AdoptionApplication::factory()->create(['status' => AdoptionApplication::STATUS_APPROVED]);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/adoption-applications/{$application->id}/review", ['status' => 'rejected'])
            ->assertUnprocessable();
    }

    public function test_admin_can_list_all_applications_with_filters(): void
    {
        $admin = User::factory()->admin()->create();
        AdoptionApplication::factory()->create(['status' => AdoptionApplication::STATUS_PENDING]);
        AdoptionApplication::factory()->create(['status' => AdoptionApplication::STATUS_REJECTED]);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/adoption-applications')
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/adoption-applications?status=rejected')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }
}
