<?php

namespace Tests\Feature;

use App\Models\Metric;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MetricTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_and_list_their_metrics(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/metrics', [
            'type' => 'numeric',
            'name' => 'Sleep',
            'unit' => 'hours',
        ])->assertStatus(201)->assertJsonPath('data.name', 'Sleep');

        $this->actingAs($user)->getJson('/api/metrics')
            ->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_metric_index_is_scoped_to_the_owner(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();
        Metric::factory()->count(3)->create(['user_id' => $alice->id]);
        Metric::factory()->count(2)->create(['user_id' => $bob->id]);

        $this->actingAs($alice)->getJson('/api/metrics')
            ->assertOk()->assertJsonCount(3, 'data');
    }

    public function test_scale_metric_requires_max_greater_than_min(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/metrics', [
            'type' => 'scale',
            'name' => 'Mood',
            'scale_min' => 5,
            'scale_max' => 3,
        ])->assertStatus(422)->assertJsonValidationErrors('scale_max');
    }

    public function test_user_cannot_view_another_users_metric(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $metric = Metric::factory()->create(['user_id' => $owner->id]);

        $this->actingAs($other)->getJson("/api/metrics/{$metric->id}")->assertStatus(403);
    }

    public function test_user_cannot_update_another_users_metric(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $metric = Metric::factory()->create(['user_id' => $owner->id, 'name' => 'Original']);

        $this->actingAs($other)->patchJson("/api/metrics/{$metric->id}", ['name' => 'Hacked'])
            ->assertStatus(403);
        $this->assertDatabaseHas('metrics', ['id' => $metric->id, 'name' => 'Original']);
    }

    public function test_user_cannot_delete_another_users_metric(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $metric = Metric::factory()->create(['user_id' => $owner->id]);

        $this->actingAs($other)->deleteJson("/api/metrics/{$metric->id}")->assertStatus(403);
        $this->assertDatabaseHas('metrics', ['id' => $metric->id]);
    }

    public function test_owner_can_delete_their_metric(): void
    {
        $user = User::factory()->create();
        $metric = Metric::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)->deleteJson("/api/metrics/{$metric->id}")->assertStatus(204);
        $this->assertDatabaseMissing('metrics', ['id' => $metric->id]);
    }

    public function test_admin_can_view_but_not_modify_another_users_metric(): void
    {
        $admin = User::factory()->admin()->create();
        $owner = User::factory()->create();
        $metric = Metric::factory()->create(['user_id' => $owner->id, 'name' => 'Owned']);

        // Admin read is allowed.
        $this->actingAs($admin)->getJson("/api/metrics/{$metric->id}")->assertOk();
        // Admin write to user data is forbidden.
        $this->actingAs($admin)->patchJson("/api/metrics/{$metric->id}", ['name' => 'X'])
            ->assertStatus(403);
        $this->actingAs($admin)->deleteJson("/api/metrics/{$metric->id}")->assertStatus(403);
    }
}
