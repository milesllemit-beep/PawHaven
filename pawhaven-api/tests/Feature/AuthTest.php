<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_user_can_register_and_receive_a_token(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertCreated()
            ->assertJsonPath('user.email', 'jane@example.com')
            ->assertJsonPath('user.role', User::ROLE_USER)
            ->assertJsonStructure(['user' => ['id', 'name', 'email', 'role'], 'token']);

        $this->assertDatabaseHas('users', [
            'email' => 'jane@example.com',
            'role' => User::ROLE_USER,
        ]);
    }

    public function test_registration_requires_unique_email_and_confirmed_password(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Jane Doe',
            'email' => 'taken@example.com',
            'password' => 'password123',
            'password_confirmation' => 'different',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_registration_assigns_the_selected_rescuer_role(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Riley Rescuer',
            'email' => 'riley@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => User::ROLE_RESCUER,
        ]);

        $response->assertCreated()
            ->assertJsonPath('user.role', User::ROLE_RESCUER);

        $this->assertDatabaseHas('users', [
            'email' => 'riley@example.com',
            'role' => User::ROLE_RESCUER,
        ]);
    }

    public function test_registration_cannot_create_an_administrator(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Sneaky Admin',
            'email' => 'sneaky@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => User::ROLE_ADMIN,
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['role']);

        $this->assertDatabaseMissing('users', ['email' => 'sneaky@example.com']);
    }

    public function test_registration_rejects_unknown_roles(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Mystery User',
            'email' => 'mystery@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'superadmin',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['role']);
    }

    public function test_a_rescuer_can_access_authenticated_routes_but_not_admin_routes(): void
    {
        $rescuer = User::factory()->rescuer()->create();
        $token = $rescuer->createToken('auth')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('data.role', User::ROLE_RESCUER);

        $this->withToken($token)
            ->getJson('/api/admin/users')
            ->assertForbidden();
    }

    public function test_a_user_can_login_with_valid_credentials(): void
    {
        User::factory()->create([
            'email' => 'jane@example.com',
            'password' => 'password123',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'jane@example.com',
            'password' => 'password123',
        ]);

        $response->assertOk()
            ->assertJsonPath('user.email', 'jane@example.com')
            ->assertJsonStructure(['user', 'token']);
    }

    public function test_login_fails_with_invalid_credentials(): void
    {
        User::factory()->create([
            'email' => 'jane@example.com',
            'password' => 'password123',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'jane@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_authenticated_user_can_fetch_profile_and_logout(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('data.email', $user->email);

        $this->withToken($token)
            ->postJson('/api/auth/logout')
            ->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_guests_cannot_access_protected_routes(): void
    {
        $this->getJson('/api/auth/me')->assertUnauthorized();
    }

    public function test_guests_receive_json_401_even_without_an_accept_header(): void
    {
        $this->get('/api/auth/me')->assertUnauthorized();
    }

    public function test_role_middleware_blocks_non_admins_and_allows_admins(): void
    {
        $route = Route::get('/api/_role-check', fn () => response()->json(['ok' => true]))
            ->middleware(['auth:sanctum', 'role:admin']);

        $user = User::factory()->create();
        $this->actingAs($user, 'sanctum')->getJson('/api/_role-check')->assertForbidden();

        $admin = User::factory()->admin()->create();
        $this->actingAs($admin, 'sanctum')->getJson('/api/_role-check')->assertOk();
    }
}
