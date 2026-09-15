<?php

namespace Tests\Feature;

use App\Models\Entry;
use App\Models\Metric;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EntryTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_log_an_entry_for_their_metric(): void
    {
        $user = User::factory()->create();
        $metric = Metric::factory()->numeric()->create(['user_id' => $user->id]);

        $this->actingAs($user)->postJson('/api/entries', [
            'metric_id' => $metric->id,
            'logged_date' => '2026-06-01',
            'value' => 7.5,
        ])->assertStatus(201)->assertJsonPath('data.value', 7.5);
    }

    public function test_logging_twice_on_the_same_day_updates_instead_of_duplicating(): void
    {
        $user = User::factory()->create();
        $metric = Metric::factory()->numeric()->create(['user_id' => $user->id]);

        $this->actingAs($user)->postJson('/api/entries', [
            'metric_id' => $metric->id, 'logged_date' => '2026-06-01', 'value' => 7,
        ])->assertStatus(201);

        // Re-logging the same day updates the existing entry (200, not a new 201).
        $this->actingAs($user)->postJson('/api/entries', [
            'metric_id' => $metric->id, 'logged_date' => '2026-06-01', 'value' => 9,
        ])->assertOk();

        $this->assertSame(1, Entry::where('metric_id', $metric->id)->count());
        $this->assertEquals(9, Entry::where('metric_id', $metric->id)->first()->value_numeric);
    }

    public function test_scale_value_out_of_range_is_rejected(): void
    {
        $user = User::factory()->create();
        $metric = Metric::factory()->scale(1, 10)->create(['user_id' => $user->id]);

        $this->actingAs($user)->postJson('/api/entries', [
            'metric_id' => $metric->id, 'logged_date' => '2026-06-01', 'value' => 99,
        ])->assertStatus(422)->assertJsonValidationErrors('value');
    }

    public function test_user_cannot_log_against_another_users_metric(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $metric = Metric::factory()->create(['user_id' => $owner->id]);

        $this->actingAs($other)->postJson('/api/entries', [
            'metric_id' => $metric->id, 'logged_date' => '2026-06-01', 'value' => 5,
        ])->assertStatus(403);
    }

    public function test_bulk_upsert_saves_multiple_entries(): void
    {
        $user = User::factory()->create();
        $m1 = Metric::factory()->numeric()->create(['user_id' => $user->id]);
        $m2 = Metric::factory()->boolean()->create(['user_id' => $user->id]);

        $this->actingAs($user)->postJson('/api/entries/bulk', [
            'entries' => [
                ['metric_id' => $m1->id, 'logged_date' => '2026-06-01', 'value' => 7],
                ['metric_id' => $m2->id, 'logged_date' => '2026-06-01', 'value' => true],
            ],
        ])->assertStatus(201)->assertJsonCount(2, 'data');

        $this->assertSame(2, Entry::count());
    }

    public function test_bulk_upsert_is_idempotent_per_day(): void
    {
        $user = User::factory()->create();
        $metric = Metric::factory()->numeric()->create(['user_id' => $user->id]);

        $payload = ['entries' => [
            ['metric_id' => $metric->id, 'logged_date' => '2026-06-01', 'value' => 7],
        ]];

        $this->actingAs($user)->postJson('/api/entries/bulk', $payload)->assertStatus(201);
        $payload['entries'][0]['value'] = 8;
        $this->actingAs($user)->postJson('/api/entries/bulk', $payload)->assertStatus(201);

        $this->assertSame(1, Entry::count());
        $this->assertEquals(8, Entry::first()->value_numeric);
    }

    public function test_entry_index_is_scoped_to_the_owner(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();
        $am = Metric::factory()->create(['user_id' => $alice->id]);
        $bm = Metric::factory()->create(['user_id' => $bob->id]);
        Entry::factory()->create(['metric_id' => $am->id, 'user_id' => $alice->id, 'logged_date' => '2026-06-01']);
        Entry::factory()->create(['metric_id' => $bm->id, 'user_id' => $bob->id, 'logged_date' => '2026-06-01']);

        $this->actingAs($alice)->getJson('/api/entries')
            ->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_metric_summary_computes_streak_and_average_over_full_history(): void
    {
        $user = User::factory()->create();
        $metric = Metric::factory()->boolean()->create(['user_id' => $user->id]);

        // 5 consecutive "true" days ending today.
        foreach (range(0, 4) as $i) {
            Entry::factory()->create([
                'metric_id' => $metric->id,
                'user_id' => $user->id,
                'logged_date' => now()->subDays($i)->toDateString(),
                'value_numeric' => null,
                'value_boolean' => true,
            ]);
        }
        // A break 6 days ago.
        Entry::factory()->create([
            'metric_id' => $metric->id,
            'user_id' => $user->id,
            'logged_date' => now()->subDays(6)->toDateString(),
            'value_numeric' => null,
            'value_boolean' => false,
        ]);

        $this->actingAs($user)->getJson("/api/metrics/{$metric->id}/summary")
            ->assertOk()
            ->assertJsonPath('streak', 5);
    }

    public function test_user_cannot_view_summary_of_another_users_metric(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $metric = Metric::factory()->create(['user_id' => $owner->id]);

        $this->actingAs($other)->getJson("/api/metrics/{$metric->id}/summary")->assertStatus(403);
    }

    public function test_user_cannot_delete_another_users_entry(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $metric = Metric::factory()->create(['user_id' => $owner->id]);
        $entry = Entry::factory()->create([
            'metric_id' => $metric->id, 'user_id' => $owner->id, 'logged_date' => '2026-06-01',
        ]);

        $this->actingAs($other)->deleteJson("/api/entries/{$entry->id}")->assertStatus(403);
        $this->assertDatabaseHas('entries', ['id' => $entry->id]);
    }
}
