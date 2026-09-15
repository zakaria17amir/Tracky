<?php

namespace Tests\Feature;

use App\Models\Metric;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_admin_cannot_access_admin_routes(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->getJson('/api/admin/users')->assertStatus(403);
    }

    public function test_admin_can_list_users(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->count(3)->create();

        $this->actingAs($admin)->getJson('/api/admin/users')
            ->assertOk()->assertJsonStructure(['data', 'meta']);
    }

    public function test_admin_can_change_another_users_role(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create(['role' => 'user']);

        $this->actingAs($admin)->patchJson("/api/admin/users/{$user->id}", ['role' => 'admin'])
            ->assertOk();
        $this->assertDatabaseHas('users', ['id' => $user->id, 'role' => 'admin']);
    }

    public function test_admin_cannot_change_their_own_role(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->patchJson("/api/admin/users/{$admin->id}", ['role' => 'user'])
            ->assertStatus(403);
    }

    public function test_admin_can_delete_a_user_and_cascade_their_data(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();
        $metric = Metric::factory()->create(['user_id' => $user->id]);

        $this->actingAs($admin)->deleteJson("/api/admin/users/{$user->id}")->assertStatus(204);
        $this->assertDatabaseMissing('users', ['id' => $user->id]);
        $this->assertDatabaseMissing('metrics', ['id' => $metric->id]);
    }

    public function test_admin_cannot_delete_themselves(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->deleteJson("/api/admin/users/{$admin->id}")->assertStatus(403);
        $this->assertDatabaseHas('users', ['id' => $admin->id]);
    }
}
