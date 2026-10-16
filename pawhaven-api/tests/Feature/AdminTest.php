<?php

namespace Tests\Feature;

use App\Models\AdoptionApplication;
use App\Models\Animal;
use App\Models\StrayReport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_admins_cannot_access_admin_endpoints(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')->getJson('/api/admin/users')->assertForbidden();
        $this->actingAs($user, 'sanctum')->getJson('/api/admin/stats')->assertForbidden();
        $this->actingAs($user, 'sanctum')
            ->patchJson('/api/admin/users/'.User::factory()->create()->id, ['role' => 'admin'])
            ->assertForbidden();
    }

    public function test_rescuers_cannot_access_admin_endpoints(): void
    {
        $rescuer = User::factory()->rescuer()->create();

        $this->actingAs($rescuer, 'sanctum')->getJson('/api/admin/users')->assertForbidden();
        $this->actingAs($rescuer, 'sanctum')->getJson('/api/admin/stats')->assertForbidden();
        $this->actingAs($rescuer, 'sanctum')
            ->patchJson('/api/admin/users/'.User::factory()->create()->id, ['role' => 'admin'])
            ->assertForbidden();
    }

    public function test_admin_can_assign_the_rescuer_role(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/users/{$user->id}", ['role' => User::ROLE_RESCUER])
            ->assertOk()
            ->assertJsonPath('data.role', User::ROLE_RESCUER);

        $this->assertSame(User::ROLE_RESCUER, $user->fresh()->role);
    }

    public function test_admins_can_list_and_filter_users(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->create(['name' => 'Jane Adopter', 'email' => 'jane@example.com']);
        User::factory()->admin()->create();

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/users')
            ->assertOk()
            ->assertJsonCount(3, 'data');

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/users?role=admin')
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/users?search=jane@example.com')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.email', 'jane@example.com');
    }

    public function test_admin_can_promote_a_user(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/users/{$user->id}", ['role' => 'admin'])
            ->assertOk()
            ->assertJsonPath('data.role', User::ROLE_ADMIN);

        $this->assertSame(User::ROLE_ADMIN, $user->fresh()->role);
    }

    public function test_admin_cannot_change_their_own_role(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/users/{$admin->id}", ['role' => 'user'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['role']);

        $this->assertSame(User::ROLE_ADMIN, $admin->fresh()->role);
    }

    public function test_role_update_validates_input(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/users/{$user->id}", ['role' => 'superadmin'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['role']);
    }

    public function test_stats_endpoint_reports_aggregates(): void
    {
        $admin = User::factory()->admin()->create();
        $available = Animal::factory()->count(2)->create(['status' => Animal::STATUS_AVAILABLE]);
        Animal::factory()->create(['status' => Animal::STATUS_ADOPTED]);
        StrayReport::factory()->create(['type' => StrayReport::TYPE_LOST]);
        StrayReport::factory()->create(['type' => StrayReport::TYPE_INJURED, 'status' => StrayReport::STATUS_RESOLVED]);
        AdoptionApplication::factory()->create([
            'animal_id' => $available->first()->id,
            'status' => AdoptionApplication::STATUS_PENDING,
        ]);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/stats')
            ->assertOk()
            ->assertJsonPath('animals.total', 3)
            ->assertJsonPath('animals.available', 2)
            ->assertJsonPath('animals.adopted', 1)
            ->assertJsonPath('stray_reports.total', 2)
            ->assertJsonPath('stray_reports.lost', 1)
            ->assertJsonPath('stray_reports.resolved', 1)
            ->assertJsonPath('adoption_applications.pending', 1)
            ->assertJsonPath('users.total', 2)
            ->assertJsonPath('users.admins', 1);
    }
}
