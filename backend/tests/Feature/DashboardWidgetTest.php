<?php

namespace Tests\Feature;

use App\Models\Dashboard;
use App\Models\Metric;
use App\Models\User;
use App\Models\Widget;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardWidgetTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_a_dashboard(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/dashboards', ['name' => 'Health'])
            ->assertStatus(201)->assertJsonPath('data.name', 'Health');
    }

    public function test_dashboards_are_scoped_to_the_owner(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();
        Dashboard::factory()->count(2)->create(['user_id' => $alice->id]);
        Dashboard::factory()->create(['user_id' => $bob->id]);

        $this->actingAs($alice)->getJson('/api/dashboards')
            ->assertOk()->assertJsonCount(2, 'data');
    }

    public function test_user_cannot_view_another_users_dashboard(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $dashboard = Dashboard::factory()->create(['user_id' => $owner->id]);

        $this->actingAs($other)->getJson("/api/dashboards/{$dashboard->id}")->assertStatus(403);
    }

    public function test_user_can_add_a_widget_to_their_dashboard(): void
    {
        $user = User::factory()->create();
        $dashboard = Dashboard::factory()->create(['user_id' => $user->id]);
        $metric = Metric::factory()->numeric()->create(['user_id' => $user->id]);

        $this->actingAs($user)->postJson("/api/dashboards/{$dashboard->id}/widgets", [
            'metric_id' => $metric->id,
            'chart_type' => 'line',
        ])->assertStatus(201)->assertJsonPath('data.chart_type', 'line');
    }

    public function test_boolean_metric_rejects_incompatible_chart_type(): void
    {
        $user = User::factory()->create();
        $dashboard = Dashboard::factory()->create(['user_id' => $user->id]);
        $metric = Metric::factory()->boolean()->create(['user_id' => $user->id]);

        $this->actingAs($user)->postJson("/api/dashboards/{$dashboard->id}/widgets", [
            'metric_id' => $metric->id,
            'chart_type' => 'line',
        ])->assertStatus(422)->assertJsonValidationErrors('chart_type');
    }

    public function test_user_cannot_add_a_widget_using_another_users_metric(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $dashboard = Dashboard::factory()->create(['user_id' => $user->id]);
        $foreignMetric = Metric::factory()->create(['user_id' => $other->id]);

        $this->actingAs($user)->postJson("/api/dashboards/{$dashboard->id}/widgets", [
            'metric_id' => $foreignMetric->id,
            'chart_type' => 'line',
        ])->assertStatus(403);
    }

    public function test_user_cannot_add_a_widget_to_another_users_dashboard(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $dashboard = Dashboard::factory()->create(['user_id' => $owner->id]);
        $metric = Metric::factory()->create(['user_id' => $other->id]);

        $this->actingAs($other)->postJson("/api/dashboards/{$dashboard->id}/widgets", [
            'metric_id' => $metric->id,
            'chart_type' => 'line',
        ])->assertStatus(403);
    }

    public function test_owner_can_update_a_widget_chart_type_and_config(): void
    {
        $user = User::factory()->create();
        $dashboard = Dashboard::factory()->create(['user_id' => $user->id]);
        $metric = Metric::factory()->numeric()->create(['user_id' => $user->id]);
        $widget = Widget::factory()->create([
            'dashboard_id' => $dashboard->id, 'metric_id' => $metric->id, 'chart_type' => 'line',
        ]);

        $this->actingAs($user)->patchJson("/api/widgets/{$widget->id}", [
            'chart_type' => 'bar',
            'config' => ['range_days' => 30],
        ])->assertOk()->assertJsonPath('data.chart_type', 'bar');

        $this->assertDatabaseHas('widgets', ['id' => $widget->id, 'chart_type' => 'bar']);
    }

    public function test_updating_a_boolean_widget_to_an_incompatible_chart_type_is_rejected(): void
    {
        $user = User::factory()->create();
        $dashboard = Dashboard::factory()->create(['user_id' => $user->id]);
        $metric = Metric::factory()->boolean()->create(['user_id' => $user->id]);
        $widget = Widget::factory()->create([
            'dashboard_id' => $dashboard->id, 'metric_id' => $metric->id, 'chart_type' => 'streak',
        ]);

        $this->actingAs($user)->patchJson("/api/widgets/{$widget->id}", ['chart_type' => 'line'])
            ->assertStatus(422)->assertJsonValidationErrors('chart_type');
    }

    public function test_user_cannot_update_another_users_widget(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $dashboard = Dashboard::factory()->create(['user_id' => $owner->id]);
        $metric = Metric::factory()->create(['user_id' => $owner->id]);
        $widget = Widget::factory()->create([
            'dashboard_id' => $dashboard->id, 'metric_id' => $metric->id,
        ]);

        $this->actingAs($other)->patchJson("/api/widgets/{$widget->id}", ['chart_type' => 'bar'])
            ->assertStatus(403);
    }

    public function test_reorder_persists_widget_positions(): void
    {
        $user = User::factory()->create();
        $dashboard = Dashboard::factory()->create(['user_id' => $user->id]);
        $metric = Metric::factory()->create(['user_id' => $user->id]);
        $w1 = Widget::factory()->create(['dashboard_id' => $dashboard->id, 'metric_id' => $metric->id, 'position' => 0]);
        $w2 = Widget::factory()->create(['dashboard_id' => $dashboard->id, 'metric_id' => $metric->id, 'position' => 1]);

        $this->actingAs($user)->patchJson("/api/dashboards/{$dashboard->id}/widgets/reorder", [
            'widget_ids' => [$w2->id, $w1->id],
        ])->assertOk();

        $this->assertEquals(0, $w2->fresh()->position);
        $this->assertEquals(1, $w1->fresh()->position);
    }

    public function test_reorder_rejects_widgets_from_another_dashboard(): void
    {
        $user = User::factory()->create();
        $dashboard = Dashboard::factory()->create(['user_id' => $user->id]);
        $otherDashboard = Dashboard::factory()->create(['user_id' => $user->id]);
        $metric = Metric::factory()->create(['user_id' => $user->id]);
        $w1 = Widget::factory()->create(['dashboard_id' => $dashboard->id, 'metric_id' => $metric->id]);
        $foreign = Widget::factory()->create(['dashboard_id' => $otherDashboard->id, 'metric_id' => $metric->id]);

        $this->actingAs($user)->patchJson("/api/dashboards/{$dashboard->id}/widgets/reorder", [
            'widget_ids' => [$w1->id, $foreign->id],
        ])->assertStatus(422);
    }

    public function test_deleting_a_dashboard_cascades_its_widgets(): void
    {
        $user = User::factory()->create();
        $dashboard = Dashboard::factory()->create(['user_id' => $user->id]);
        $metric = Metric::factory()->create(['user_id' => $user->id]);
        $widget = Widget::factory()->create(['dashboard_id' => $dashboard->id, 'metric_id' => $metric->id]);

        $this->actingAs($user)->deleteJson("/api/dashboards/{$dashboard->id}")->assertStatus(204);
        $this->assertDatabaseMissing('widgets', ['id' => $widget->id]);
    }
}
