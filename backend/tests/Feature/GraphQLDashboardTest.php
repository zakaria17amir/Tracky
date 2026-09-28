<?php

namespace Tests\Feature;

use App\Models\Dashboard;
use App\Models\Entry;
use App\Models\Metric;
use App\Models\User;
use App\Models\Widget;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class GraphQLDashboardTest extends TestCase
{
    use RefreshDatabase;

    private const QUERY = <<<'GRAPHQL'
        query ($id: ID!) {
          dashboard(id: $id) {
            id
            name
            widgets {
              id
              chart_type
              position
              config
              metric { id name type unit }
              entries { logged_date value }
              summary(threshold: 1) { current average streak }
            }
          }
        }
        GRAPHQL;

    private function query(int $id)
    {
        return $this->postJson('/api/graphql', ['query' => self::QUERY, 'variables' => ['id' => $id]]);
    }

    public function test_owner_gets_widgets_with_metric_entries_and_summary_in_one_request(): void
    {
        $user = User::factory()->create();
        $dashboard = Dashboard::factory()->create(['user_id' => $user->id]);
        $metric = Metric::factory()->numeric('h')->create(['user_id' => $user->id, 'name' => 'Sleep']);
        foreach ([0, 1, 2] as $daysAgo) {
            Entry::factory()->create([
                'metric_id' => $metric->id,
                'user_id' => $user->id,
                'logged_date' => now()->subDays($daysAgo)->toDateString(),
                'value_numeric' => 7,
            ]);
        }
        Entry::factory()->create([
            'metric_id' => $metric->id,
            'user_id' => $user->id,
            'logged_date' => now()->subDays(200)->toDateString(),
            'value_numeric' => 1,
        ]);
        $second = Widget::factory()->create(['dashboard_id' => $dashboard->id, 'metric_id' => $metric->id, 'chart_type' => 'stat', 'position' => 1]);
        $first = Widget::factory()->create(['dashboard_id' => $dashboard->id, 'metric_id' => $metric->id, 'chart_type' => 'line', 'position' => 0, 'config' => ['range_days' => 14]]);

        $this->actingAs($user)->query($dashboard->id)
            ->assertOk()
            ->assertJsonMissingPath('errors')
            ->assertJsonPath('data.dashboard.widgets.0.id', (string) $first->id)
            ->assertJsonPath('data.dashboard.widgets.1.id', (string) $second->id)
            ->assertJsonPath('data.dashboard.widgets.0.config.range_days', 14)
            ->assertJsonPath('data.dashboard.widgets.0.metric.name', 'Sleep')
            ->assertJsonCount(3, 'data.dashboard.widgets.0.entries')
            ->assertJsonPath('data.dashboard.widgets.0.entries.2.value', 7)
            ->assertJsonPath('data.dashboard.widgets.1.summary.streak', 3)
            ->assertJsonPath('data.dashboard.widgets.1.summary.current', 7);
    }

    public function test_user_cannot_query_another_users_dashboard(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $dashboard = Dashboard::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($other)->query($dashboard->id)->assertOk();

        $this->assertNull($response->json('data.dashboard'));
        $this->assertStringContainsStringIgnoringCase('unauthorized', $response->json('errors.0.message'));
    }

    public function test_guest_is_rejected(): void
    {
        $dashboard = Dashboard::factory()->create();

        $this->query($dashboard->id)->assertStatus(401);
    }

    public function test_admin_can_query_another_users_dashboard(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $dashboard = Dashboard::factory()->create(['name' => 'Private']);

        $this->actingAs($admin)->query($dashboard->id)
            ->assertOk()
            ->assertJsonPath('data.dashboard.name', 'Private');
    }

    public function test_repeating_a_query_works_on_a_serializing_cache_store(): void
    {
        // Laravel 13 refuses to unserialize objects from the cache (serializable_classes = false),
        // so a cached parsed query must never be read back as an object.
        config(['cache.default' => 'file']);
        Cache::flush();
        $user = User::factory()->create();
        $dashboard = Dashboard::factory()->create(['user_id' => $user->id]);
        $this->actingAs($user);

        $this->query($dashboard->id)->assertOk()->assertJsonMissingPath('errors');
        $this->query($dashboard->id)->assertOk()->assertJsonMissingPath('errors');
    }

    public function test_metrics_are_eager_loaded_so_queries_grow_only_with_per_widget_data(): void
    {
        $user = User::factory()->create();
        $dashboard = Dashboard::factory()->create(['user_id' => $user->id]);
        Widget::factory()->count(4)->sequence(fn ($s) => ['position' => $s->index])->create([
            'dashboard_id' => $dashboard->id,
            'metric_id' => fn () => Metric::factory()->create(['user_id' => $user->id])->id,
        ]);
        $this->actingAs($user);

        DB::enableQueryLog();
        $this->query($dashboard->id)->assertOk()->assertJsonMissingPath('errors');

        // dashboard + widgets + metrics, then entries and summary once per widget.
        $this->assertLessThanOrEqual(3 + 2 * 4, count(DB::getQueryLog()));
    }
}
