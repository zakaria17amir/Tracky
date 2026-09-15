<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_returns_a_token_and_user_with_default_role(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Jane',
            'email' => 'jane@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['user' => ['id', 'name', 'email', 'role'], 'token']);
        $this->assertSame('user', $response->json('user.role'));
        $this->assertDatabaseHas('users', ['email' => 'jane@example.com', 'role' => 'user']);
    }

    public function test_registration_cannot_self_assign_admin_role(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Sneaky',
            'email' => 'sneaky@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'admin',
        ]);

        $response->assertStatus(201);
        $this->assertSame('user', $response->json('user.role'));
        $this->assertDatabaseHas('users', ['email' => 'sneaky@example.com', 'role' => 'user']);
    }

    public function test_registration_validates_input(): void
    {
        $this->postJson('/api/register', [
            'name' => '',
            'email' => 'not-an-email',
            'password' => 'short',
        ])->assertStatus(422)->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    public function test_login_returns_a_token(): void
    {
        User::factory()->create([
            'email' => 'bob@example.com',
            'password' => 'password123',
        ]);

        $this->postJson('/api/login', [
            'email' => 'bob@example.com',
            'password' => 'password123',
        ])->assertOk()->assertJsonStructure(['user', 'token']);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        User::factory()->create(['email' => 'bob@example.com', 'password' => 'password123']);

        $this->postJson('/api/login', [
            'email' => 'bob@example.com',
            'password' => 'wrong-password',
        ])->assertStatus(422);
    }

    public function test_protected_route_requires_authentication(): void
    {
        $this->getJson('/api/user')->assertStatus(401);
    }

    public function test_authenticated_user_can_fetch_profile(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('email', $user->email);
    }

    public function test_logout_revokes_the_current_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('api')->plainTextToken;

        $this->assertDatabaseCount('personal_access_tokens', 1);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/logout')->assertOk();

        // The token is revoked (removed) so it can no longer be used.
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_user_can_update_their_profile(): void
    {
        $user = User::factory()->create(['name' => 'Old Name']);

        $this->actingAs($user)->patchJson('/api/user', ['name' => 'New Name'])
            ->assertOk()->assertJsonPath('name', 'New Name');
        $this->assertDatabaseHas('users', ['id' => $user->id, 'name' => 'New Name']);
    }
}
